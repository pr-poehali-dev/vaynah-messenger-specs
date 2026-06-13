import os
import json
import base64
import uuid
import psycopg2
import boto3

def get_s3():
    return boto3.client("s3", endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"])

def cdn_url(key):
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p48581099_vaynah_messenger_spe")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_user_id(cur, email):
    cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE email = %s", (email,))
    r = cur.fetchone()
    return r[0] if r else None


def handler(event: dict, context) -> dict:
    """Социальные функции: чаты, сообщения, друзья, заявки в друзья."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    action = params.get("action") or ""
    method = event.get("httpMethod", "GET")

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    try:
        # GET /social?action=chats&email=...
        if method == "GET" and action == "chats":
            email = (params.get("email") or "").strip().lower()
            my_id = get_user_id(cur, email)
            if not my_id:
                return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Не найден"})}

            cur.execute(f"""
                SELECT u.id, u.name, u.surname, u.email,
                       m.text, m.created_at, m.from_user_id,
                       (SELECT COUNT(*) FROM {SCHEMA}.messages
                        WHERE from_user_id = u.id AND to_user_id = %(my)s AND is_read = FALSE) as unread
                FROM {SCHEMA}.users u
                JOIN LATERAL (
                    SELECT id, text, created_at, from_user_id
                    FROM {SCHEMA}.messages
                    WHERE (from_user_id = u.id AND to_user_id = %(my)s)
                       OR (from_user_id = %(my)s AND to_user_id = u.id)
                    ORDER BY created_at DESC LIMIT 1
                ) m ON TRUE
                WHERE u.id != %(my)s
                ORDER BY m.created_at DESC
            """, {"my": my_id})
            rows = cur.fetchall()
            chats = [{"id": r[0], "name": r[1] or "", "surname": r[2] or "", "email": r[3],
                      "avatar": (r[1] or "?")[0].upper(), "lastMsg": r[4],
                      "time": r[5].strftime("%H:%M"), "unread": r[7], "online": False,
                      "from_me": r[6] == my_id} for r in rows]
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "chats": chats})}

        # GET /social?action=messages&my_email=...&other_email=...
        elif method == "GET" and action == "messages":
            my_email = (params.get("my_email") or "").strip().lower()
            other_email = (params.get("other_email") or "").strip().lower()
            my_id = get_user_id(cur, my_email)
            other_id = get_user_id(cur, other_email)
            if not my_id or not other_id:
                return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Пользователь не найден"})}

            cur.execute(f"""
                SELECT id, from_user_id, text, created_at
                FROM {SCHEMA}.messages
                WHERE (from_user_id = %s AND to_user_id = %s)
                   OR (from_user_id = %s AND to_user_id = %s)
                ORDER BY created_at ASC LIMIT 200
            """, (my_id, other_id, other_id, my_id))
            rows = cur.fetchall()

            cur.execute(f"""
                UPDATE {SCHEMA}.messages SET is_read = TRUE
                WHERE from_user_id = %s AND to_user_id = %s AND is_read = FALSE
            """, (other_id, my_id))
            conn.commit()

            messages = [{"id": r[0], "from_me": r[1] == my_id, "text": r[2], "time": r[3].strftime("%H:%M")} for r in rows]
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "messages": messages})}

        # GET /social?action=friends&email=...
        elif method == "GET" and action == "friends":
            email = (params.get("email") or "").strip().lower()
            my_id = get_user_id(cur, email)
            if not my_id:
                return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Не найден"})}

            cur.execute(f"""
                SELECT u.id, u.name, u.surname, u.city, u.email
                FROM {SCHEMA}.friendships f
                JOIN {SCHEMA}.users u ON (
                    CASE WHEN f.from_user_id = %s THEN f.to_user_id ELSE f.from_user_id END = u.id
                )
                WHERE (f.from_user_id = %s OR f.to_user_id = %s) AND f.status = 'accepted'
            """, (my_id, my_id, my_id))
            friends = [{"id": r[0], "name": r[1] or "", "surname": r[2] or "", "city": r[3] or "",
                        "email": r[4], "avatar": (r[1] or "?")[0].upper(), "online": False} for r in cur.fetchall()]

            cur.execute(f"""
                SELECT u.id, u.name, u.surname, u.city, u.email, f.id, f.created_at
                FROM {SCHEMA}.friendships f
                JOIN {SCHEMA}.users u ON f.from_user_id = u.id
                WHERE f.to_user_id = %s AND f.status = 'pending'
                ORDER BY f.created_at DESC
            """, (my_id,))
            incoming = [{"req_id": r[5], "id": r[0], "name": r[1] or "", "surname": r[2] or "",
                         "city": r[3] or "", "email": r[4], "avatar": (r[1] or "?")[0].upper(),
                         "time": r[6].strftime("%H:%M")} for r in cur.fetchall()]

            cur.execute(f"SELECT to_user_id FROM {SCHEMA}.friendships WHERE from_user_id = %s AND status = 'pending'", (my_id,))
            outgoing_ids = [r[0] for r in cur.fetchall()]

            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "friends": friends, "incoming": incoming, "outgoing_ids": outgoing_ids})}

        # POST /social?action=send-message
        elif method == "POST" and action == "send-message":
            body = json.loads(event.get("body") or "{}")
            from_email = (body.get("from_email") or "").strip().lower()
            to_email = (body.get("to_email") or "").strip().lower()
            text = (body.get("text") or "").strip()
            if not from_email or not to_email or not text:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Заполните все поля"})}

            from_id = get_user_id(cur, from_email)
            to_id = get_user_id(cur, to_email)
            if not from_id or not to_id:
                return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Пользователь не найден"})}

            cur.execute(f"INSERT INTO {SCHEMA}.messages (from_user_id, to_user_id, text) VALUES (%s, %s, %s) RETURNING id, created_at",
                        (from_id, to_id, text))
            msg_id, created_at = cur.fetchone()
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "id": msg_id, "time": created_at.strftime("%H:%M")})}

        # POST /social?action=friend
        elif method == "POST" and action == "friend":
            body = json.loads(event.get("body") or "{}")
            from_email = (body.get("from_email") or "").strip().lower()
            to_email = (body.get("to_email") or "").strip().lower()
            fr_action = (body.get("fr_action") or "").strip()  # send|accept|decline|remove

            from_id = get_user_id(cur, from_email)
            to_id = get_user_id(cur, to_email)
            if not from_id or not to_id:
                return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Пользователь не найден"})}

            if fr_action == "send":
                cur.execute(f"INSERT INTO {SCHEMA}.friendships (from_user_id, to_user_id, status) VALUES (%s, %s, 'pending') ON CONFLICT DO NOTHING", (from_id, to_id))
            elif fr_action == "accept":
                cur.execute(f"UPDATE {SCHEMA}.friendships SET status='accepted', updated_at=NOW() WHERE from_user_id=%s AND to_user_id=%s", (from_id, to_id))
            elif fr_action == "decline":
                cur.execute(f"UPDATE {SCHEMA}.friendships SET status='declined', updated_at=NOW() WHERE from_user_id=%s AND to_user_id=%s", (from_id, to_id))
            elif fr_action == "remove":
                cur.execute(f"UPDATE {SCHEMA}.friendships SET status='removed', updated_at=NOW() WHERE (from_user_id=%s AND to_user_id=%s) OR (from_user_id=%s AND to_user_id=%s)", (from_id, to_id, to_id, from_id))
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        # POST /social?action=block
        elif method == "POST" and action == "block":
            body = json.loads(event.get("body") or "{}")
            my_email = (body.get("my_email") or "").strip().lower()
            target_email = (body.get("target_email") or "").strip().lower()
            block_action = (body.get("block_action") or "block").strip()  # block|unblock

            my_id = get_user_id(cur, my_email)
            target_id = get_user_id(cur, target_email)
            if not my_id or not target_id:
                return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Пользователь не найден"})}

            if block_action == "block":
                cur.execute(f"INSERT INTO {SCHEMA}.blocks (blocker_id, blocked_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (my_id, target_id))
            elif block_action == "unblock":
                cur.execute(f"DELETE FROM {SCHEMA}.blocks WHERE blocker_id = %s AND blocked_id = %s", (my_id, target_id))
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        # GET /social?action=blocked&email=...
        elif method == "GET" and action == "blocked":
            email = (params.get("email") or "").strip().lower()
            my_id = get_user_id(cur, email)
            if not my_id:
                return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Не найден"})}

            cur.execute(f"""
                SELECT u.id, u.name, u.surname, u.city, u.email
                FROM {SCHEMA}.blocks b
                JOIN {SCHEMA}.users u ON b.blocked_id = u.id
                WHERE b.blocker_id = %s
                ORDER BY b.created_at DESC
            """, (my_id,))
            blocked = [{"id": r[0], "name": r[1] or "", "surname": r[2] or "", "city": r[3] or "",
                        "email": r[4], "avatar": (r[1] or "?")[0].upper()} for r in cur.fetchall()]
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "blocked": blocked})}

        # GET /social?action=statuses&email=...
        elif method == "GET" and action == "statuses":
            email = (params.get("email") or "").strip().lower()
            my_id_for_block = None
            if email:
                my_id_for_block = get_user_id(cur, email)

            cur.execute(f"""
                SELECT s.id, s.type, s.content, s.file_url, s.color, s.emoji, s.created_at,
                       u.id, u.name, u.surname, u.avatar_url
                FROM {SCHEMA}.statuses s
                JOIN {SCHEMA}.users u ON s.user_id = u.id
                WHERE s.expires_at > NOW()
                  AND ({my_id_for_block} IS NULL OR u.id NOT IN (
                      SELECT blocked_id FROM {SCHEMA}.blocks WHERE blocker_id = {my_id_for_block if my_id_for_block else 0}
                  ))
                ORDER BY s.created_at DESC
                LIMIT 50
            """)
            rows = cur.fetchall()
            statuses = [{
                "id": r[0], "type": r[1], "content": r[2], "file_url": r[3],
                "color": r[4], "emoji": r[5], "time": r[6].strftime("%H:%M"),
                "user_id": r[7], "user_name": r[8] or "", "user_surname": r[9] or "",
                "avatar_url": r[10],
                "avatar": (r[8] or "?")[0].upper(),
                "is_mine": my_id_for_block is not None and r[7] == my_id_for_block,
            } for r in rows]
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "statuses": statuses})}

        # POST /social?action=upload  (аватар или статус)
        elif method == "POST" and action == "upload":
            body = json.loads(event.get("body") or "{}")
            upload_type = (body.get("upload_type") or "").strip()  # avatar | status
            email = (body.get("email") or "").strip().lower()
            file_data = body.get("file") or ""
            mime = (body.get("mime") or "image/jpeg").strip()

            if not email or not file_data or not upload_type:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажите email, upload_type и file"})}

            if "," in file_data:
                file_data = file_data.split(",", 1)[1]
            file_bytes = base64.b64decode(file_data)

            ext = mime.split("/")[-1].replace("jpeg", "jpg")
            file_key = f"vainakh/{upload_type}/{uuid.uuid4().hex}.{ext}"

            s3 = get_s3()
            s3.put_object(Bucket="files", Key=file_key, Body=file_bytes, ContentType=mime)
            url = cdn_url(file_key)

            my_id = get_user_id(cur, email)
            if not my_id:
                return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Пользователь не найден"})}

            if upload_type == "avatar":
                cur.execute(f"UPDATE {SCHEMA}.users SET avatar_url = %s, updated_at = NOW() WHERE id = %s", (url, my_id))
                conn.commit()
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "url": url})}

            elif upload_type == "status":
                content = (body.get("content") or "").strip()
                status_type = (body.get("status_type") or "photo").strip()
                color = body.get("color") or None
                emoji = body.get("emoji") or None
                cur.execute(
                    f"INSERT INTO {SCHEMA}.statuses (user_id, type, content, file_url, color, emoji) VALUES (%s,%s,%s,%s,%s,%s) RETURNING id",
                    (my_id, status_type, content, url, color, emoji)
                )
                status_id = cur.fetchone()[0]
                conn.commit()
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "url": url, "status_id": status_id})}

        # POST /social?action=status-text  (текстовый статус без файла)
        elif method == "POST" and action == "status-text":
            body = json.loads(event.get("body") or "{}")
            email = (body.get("email") or "").strip().lower()
            content = (body.get("content") or "").strip()
            color = body.get("color") or None
            emoji = body.get("emoji") or None

            my_id = get_user_id(cur, email)
            if not my_id or not content:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нет данных"})}

            cur.execute(
                f"INSERT INTO {SCHEMA}.statuses (user_id, type, content, color, emoji) VALUES (%s,'text',%s,%s,%s) RETURNING id",
                (my_id, content, color, emoji)
            )
            status_id = cur.fetchone()[0]
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "status_id": status_id})}

        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Неизвестный action"})}

    finally:
        cur.close()
        conn.close()