import os
import random
import json
import urllib.request
import urllib.parse
import psycopg2
from datetime import datetime, timedelta

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p48581099_vaynah_messenger_spe")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def handler(event: dict, context) -> dict:
    """Отправляет 4-значный одноразовый код на email пользователя через Unisender API."""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Неверный формат запроса"})}

    email = (body.get("email") or "").strip().lower()
    if not email or "@" not in email:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажите корректный email"})}

    code = str(random.randint(1000, 9999))
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    try:
        cur.execute(
            f"DELETE FROM {SCHEMA}.auth_codes WHERE email = %s AND used = FALSE",
            (email,)
        )
        cur.execute(
            f"INSERT INTO {SCHEMA}.auth_codes (email, code, expires_at) VALUES (%s, %s, %s)",
            (email, code, expires_at)
        )
        conn.commit()
    finally:
        cur.close()
        conn.close()

    api_key = os.environ.get("UNISENDER_API_KEY", "").strip()
    sender_email = os.environ.get("SMTP_USER", "").strip()

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0D1626; border-radius: 16px;">
      <h1 style="color: #42A5F5; font-size: 24px; margin-bottom: 8px;">🏔 ВайНах</h1>
      <p style="color: #8080AA; font-size: 14px; margin-bottom: 32px;">Мессенджер твоего народа</p>
      <p style="color: #E8F0FE; font-size: 16px; margin-bottom: 16px;">Ваш код для входа:</p>
      <div style="background: #1A2D4A; border: 1px solid #2196F3; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <span style="color: #42A5F5; font-size: 40px; font-weight: 900; letter-spacing: 12px;">{code}</span>
      </div>
      <p style="color: #5C7CA0; font-size: 13px;">Код действителен 10 минут. Никому его не сообщайте.</p>
      <p style="color: #5C7CA0; font-size: 12px; margin-top: 24px;">Если вы не запрашивали вход — просто проигнорируйте это письмо.</p>
    </div>
    """

    params = urllib.parse.urlencode({
        "api_key": api_key,
        "format": "json",
        "email": email,
        "sender_name": "ВайНах",
        "sender_email": sender_email,
        "subject": "Ваш код для входа в ВайНах",
        "body": f"Ваш код для входа в ВайНах: {code}\nКод действителен 10 минут.",
        "list_id": "1",
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.unisender.com/ru/api/sendEmail",
        data=params,
        method="POST"
    )

    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read().decode("utf-8"))

    print(f"Unisender response: {result}")

    if "error" in result:
        return {
            "statusCode": 500,
            "headers": CORS,
            "body": json.dumps({"error": f"Ошибка Unisender: {result['error']}"})
        }

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({"ok": True, "message": f"Код отправлен на {email}"})
    }