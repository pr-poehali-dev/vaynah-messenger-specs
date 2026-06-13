import os
import random
import smtplib
import json
import ssl
import psycopg2
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p48581099_vaynah_messenger_spe")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def handler(event: dict, context) -> dict:
    """Отправляет 4-значный одноразовый код на email пользователя через Mail.ru SMTP."""

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

    smtp_user = os.environ.get("SMTP_USER", "").strip()
    smtp_password = os.environ.get("SMTP_PASSWORD", "").strip()

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

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Ваш код для входа в ВайНах"
    msg["From"] = f"ВайНах <{smtp_user}>"
    msg["To"] = email
    msg.attach(MIMEText(f"Ваш код для входа в ВайНах: {code}\nКод действителен 10 минут.", "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    context_ssl = ssl.create_default_context()
    with smtplib.SMTP_SSL("smtp.mail.ru", 465, context=context_ssl, timeout=15) as server:
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_user, email, msg.as_string())

    print(f"Код отправлен на {email}")
    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({"ok": True, "message": f"Код отправлен на {email}"})
    }
