import os
import json
import psycopg2
from datetime import datetime

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p48581099_vaynah_messenger_spe")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def handler(event: dict, context) -> dict:
    """Проверяет код из письма. Создаёт аккаунт при первом входе."""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Неверный формат"})}

    email = (body.get("email") or "").strip().lower()
    code = (body.get("code") or "").strip()

    if not email or not code:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажите email и код"})}

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    try:
        now = datetime.utcnow()

        # Ищем актуальный неиспользованный код
        cur.execute(
            f"""
            SELECT id, expires_at
            FROM {SCHEMA}.auth_codes
            WHERE email = %s AND code = %s AND used = FALSE
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (email, code)
        )
        row = cur.fetchone()

        if not row:
            return {
                "statusCode": 401,
                "headers": CORS,
                "body": json.dumps({"error": "Неверный код. Проверьте письмо и попробуйте снова."})
            }

        code_id, expires_at = row
        if now > expires_at:
            return {
                "statusCode": 401,
                "headers": CORS,
                "body": json.dumps({"error": "Код устарел. Запросите новый."})
            }

        # Помечаем код как использованный
        cur.execute(
            f"UPDATE {SCHEMA}.auth_codes SET used = TRUE WHERE id = %s",
            (code_id,)
        )

        # Создаём или находим пользователя
        cur.execute(
            f"SELECT id, name, surname, city, birthdate, about, phone, avatar_url FROM {SCHEMA}.users WHERE email = %s",
            (email,)
        )
        user_row = cur.fetchone()

        is_new = False
        if user_row:
            user_id, name, surname, city, birthdate, about, phone, avatar_url = user_row
        else:
            cur.execute(
                f"INSERT INTO {SCHEMA}.users (email) VALUES (%s) RETURNING id",
                (email,)
            )
            user_id = cur.fetchone()[0]
            name = surname = city = about = phone = ""
            birthdate = None
            avatar_url = ""
            is_new = True

        conn.commit()

        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({
                "ok": True,
                "is_new": is_new,
                "user": {
                    "id": user_id,
                    "email": email,
                    "name": name or "",
                    "surname": surname or "",
                    "city": city or "",
                    "birthdate": str(birthdate) if birthdate else "",
                    "about": about or "",
                    "phone": phone or "",
                    "avatar_url": avatar_url or "",
                }
            })
        }

    finally:
        cur.close()
        conn.close()