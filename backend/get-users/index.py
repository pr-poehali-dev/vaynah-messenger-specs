import os
import json
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p48581099_vaynah_messenger_spe")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def handler(event: dict, context) -> dict:
    """Возвращает список всех зарегистрированных пользователей кроме текущего."""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    current_email = (params.get("email") or "").strip().lower()

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    try:
        cur.execute(
            f"""
            SELECT id, email, name, surname, city, about
            FROM {SCHEMA}.users
            WHERE name IS NOT NULL AND name != ''
            AND email != %s
            ORDER BY created_at DESC
            """,
            (current_email,)
        )
        rows = cur.fetchall()
    finally:
        cur.close()
        conn.close()

    users = []
    for row in rows:
        uid, email, name, surname, city, about = row
        users.append({
            "id": uid,
            "email": email,
            "name": name or "",
            "surname": surname or "",
            "city": city or "",
            "about": about or "",
            "online": False,
            "avatar": (name or " ")[0].upper(),
        })

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({"ok": True, "users": users})
    }
