import os
import json
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p48581099_vaynah_messenger_spe")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def handler(event: dict, context) -> dict:
    """Обновляет профиль пользователя после первой регистрации."""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Неверный формат"})}

    email = (body.get("email") or "").strip().lower()
    name = (body.get("name") or "").strip()
    surname = (body.get("surname") or "").strip()
    city = (body.get("city") or "").strip()
    birthdate = body.get("birthdate") or None
    about = (body.get("about") or "").strip()
    phone = (body.get("phone") or "").strip()

    if not email:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Email обязателен"})}

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    try:
        cur.execute(
            f"""
            UPDATE {SCHEMA}.users
            SET name = %s, surname = %s, city = %s,
                birthdate = %s, about = %s, phone = %s, updated_at = NOW()
            WHERE email = %s
            RETURNING id
            """,
            (name, surname, city, birthdate or None, about, phone, email)
        )
        row = cur.fetchone()
        if not row:
            return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Пользователь не найден"})}
        conn.commit()
        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({"ok": True, "user_id": row[0]})
        }
    finally:
        cur.close()
        conn.close()
