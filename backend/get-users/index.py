import os
import json
import psycopg2
from datetime import datetime

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p48581099_vaynah_messenger_spe")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def is_online(last_seen):
    if not last_seen:
        return False
    return (datetime.now() - last_seen).total_seconds() < 120


def handler(event: dict, context) -> dict:
    """Возвращает список всех зарегистрированных пользователей кроме текущего."""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    current_email = (params.get("email") or "").strip().lower()

    print(f"[get-users] called, current_email={current_email!r}")

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    try:
        cur.execute(
            f"""
            SELECT id, email, name, surname, city, about, avatar_url, last_seen
            FROM {SCHEMA}.users
            WHERE name IS NOT NULL AND name != ''
            ORDER BY created_at DESC
            """,
        )
        rows = cur.fetchall()
        print(f"[get-users] total rows before filter: {len(rows)}")
    except Exception as e:
        print(f"[get-users] DB ERROR: {e}")
        cur.close()
        conn.close()
        return {"statusCode": 500, "headers": CORS, "body": json.dumps({"ok": False, "error": str(e)})}
    finally:
        cur.close()
        conn.close()

    users = []
    for row in rows:
        uid, email, name, surname, city, about, avatar_url, last_seen = row
        # Фильтруем текущего пользователя на Python стороне
        if current_email and email and email.strip().lower() == current_email:
            continue
        users.append({
            "id": uid,
            "email": email or "",
            "name": name or "",
            "surname": surname or "",
            "city": city or "",
            "about": about or "",
            "online": is_online(last_seen),
            "avatar": (name or " ")[0].upper(),
            "avatar_url": avatar_url or "",
        })

    print(f"[get-users] returning {len(users)} users")
    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({"ok": True, "users": users})
    }
