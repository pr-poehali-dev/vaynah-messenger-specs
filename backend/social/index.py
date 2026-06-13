import os
import json
import base64
import uuid
import psycopg2
import boto3
from datetime import datetime, timedelta

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

def is_online(last_seen):
    if not last_seen:
        return False
    return (datetime.now() - last_seen).total_seconds() < 120

def format_last_seen(last_seen):
    if not last_seen:
        return "давно"
    delta = datetime.now() - last_seen
    secs = int(delta.total_seconds())
    if secs < 120:
        return "онлайн"
    if secs < 3600:
        return f"был(а) {secs // 60} мин назад"
    if secs < 86400:
        return f"был(а) {secs // 3600} ч назад"
    return f"был(а) {secs // 86400} дн назад"

def handler(event: dict, context) -> dict:
    """Социальные функции: чаты, сообщения, друзья, заявки, файлы, онлайн, typing."""
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

            # Обновляем last_seen
            cur.execute(f"UPDATE {SCHEMA}.users SET last_seen = NOW() WHERE id = %s", (my_id,))
            conn.commit()

            cur.execute(f"""
                SELECT u.id, u.name, u.surname, u.email, u.avatar_url,
                       m.text, m.msg_type, m.file_name, m.created_at, m.from_user_id,
                       (SELECT COUNT(*) FROM {SCHEMA}.messages
                        WHERE from_user_id = u.id AND to_user_id = %(my)s AND is_read = FALSE) as unread,
                       u.last_seen
                FROM {SCHEMA}.users u
                JOIN LATERAL (
                    SELECT id, text, created_at, from_user_id, msg_type, file_name
                    FROM {SCHEMA}.messages
                    WHERE (from_user_id = u.id AND to_user_id = %(my)s)
                       OR (from_user_id = %(my)s AND to_user_id = u.id)
                    ORDER BY created_at DESC LIMIT 1
                ) m ON TRUE
                WHERE u.id != %(my)s
                ORDER BY m.created_at DESC
            """, {"my": my_id})
            rows = cur.fetchall()
            chats = []
            for r in rows:
                last_seen = r[11]
                online = is_online(last_seen)
                msg_type = r[6] or "text"
                last_msg = r[5] or ""
                if msg_type != "text" and r[7]:
                    last_msg = {"image": "📷 Фото", "video": "🎥 Видео", "audio": "🎵 Аудио",
                                "document": "📄 Документ", "voice": "🎤 Голосовое", "circle": "⭕ Видеосообщение"}.get(msg_type, r[7])
                chats.append({
                    "id": r[0], "name": r[1] or "", "surname": r[2] or "", "email": r[3],
                    "avatar": (r[1] or "?")[0].upper(), "avatar_url": r[4] or "",
                    "lastMsg": last_msg, "time": r[8].strftime("%H:%M"),
                    "unread": r[10], "online": online, "from_me": r[9] == my_id,
                    "last_seen": format_last_seen(last_seen),
                })
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "chats": chats})}

        # GET /social?action=messages&my_email=...&other_email=...
        elif method == "GET" and action == "messages":
            my_email = (params.get("my_email") or "").strip().lower()
            other_email = (params.get("other_email") or "").strip().lower()
            my_id = get_user_id(cur, my_email)
            other_id = get_user_id(cur, other_email)
            if not my_id or not other_id:
                return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Пользователь не найден"})}

            # Обновляем last_seen
            cur.execute(f"UPDATE {SCHEMA}.users SET last_seen = NOW() WHERE id = %s", (my_id,))

            cur.execute(f"""
                SELECT id, from_user_id, text, created_at, msg_type, file_url, file_name, duration
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

            # Статус собеседника
            cur.execute(f"SELECT last_seen FROM {SCHEMA}.users WHERE id = %s", (other_id,))
            other_row = cur.fetchone()
            other_last_seen = other_row[0] if other_row else None

            # Проверяем typing
            cur.execute(f"""
                SELECT updated_at FROM {SCHEMA}.typing
                WHERE user_id = %s AND to_user_id = %s
            """, (other_id, my_id))
            typing_row = cur.fetchone()
            is_typing = False
            if typing_row:
                is_typing = (datetime.now() - typing_row[0]).total_seconds() < 5

            conn.commit()

            messages = [{
                "id": r[0], "from_me": r[1] == my_id, "text": r[2] or "",
                "time": r[3].strftime("%H:%M"),
                "type": r[4] or "text",
                "file_url": r[5] or "",
                "file_name": r[6] or "",
                "duration": r[7] or "",
            } for r in rows]

            return {"statusCode": 200, "headers": CORS, "body": json.dumps({
                "ok": True, "messages": messages,
                "other_online": is_online(other_last_seen),
                "other_last_seen": format_last_seen(other_last_seen),
                "other_typing": is_typing,
            })}

        # GET /social?action=friends&email=...
        elif method == "GET" and action == "friends":
            email = (params.get("email") or "").strip().lower()
            my_id = get_user_id(cur, email)
            if not my_id:
                return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Не найден"})}

            cur.execute(f"""
                SELECT u.id, u.name, u.surname, u.city, u.email, u.avatar_url, u.last_seen
                FROM {SCHEMA}.friendships f
                JOIN {SCHEMA}.users u ON (
                    CASE WHEN f.from_user_id = %s THEN f.to_user_id ELSE f.from_user_id END = u.id
                )
                WHERE (f.from_user_id = %s OR f.to_user_id = %s) AND f.status = 'accepted'
            """, (my_id, my_id, my_id))
            friends = [{
                "id": r[0], "name": r[1] or "", "surname": r[2] or "", "city": r[3] or "",
                "email": r[4], "avatar": (r[1] or "?")[0].upper(),
                "avatar_url": r[5] or "",
                "online": is_online(r[6]),
                "last_seen": format_last_seen(r[6]),
            } for r in cur.fetchall()]

            cur.execute(f"""
                SELECT u.id, u.name, u.surname, u.city, u.email, f.id, f.created_at, u.avatar_url
                FROM {SCHEMA}.friendships f
                JOIN {SCHEMA}.users u ON f.from_user_id = u.id
                WHERE f.to_user_id = %s AND f.status = 'pending'
                ORDER BY f.created_at DESC
            """, (my_id,))
            incoming = [{"req_id": r[5], "id": r[0], "name": r[1] or "", "surname": r[2] or "",
                         "city": r[3] or "", "email": r[4], "avatar": (r[1] or "?")[0].upper(),
                         "avatar_url": r[7] or "", "time": r[6].strftime("%H:%M")} for r in cur.fetchall()]

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

            cur.execute(f"INSERT INTO {SCHEMA}.messages (from_user_id, to_user_id, text, msg_type) VALUES (%s, %s, %s, 'text') RETURNING id, created_at",
                        (from_id, to_id, text))
            msg_id, created_at = cur.fetchone()
            # Сбрасываем typing
            cur.execute(f"DELETE FROM {SCHEMA}.typing WHERE user_id = %s", (from_id,))
            cur.execute(f"UPDATE {SCHEMA}.users SET last_seen = NOW() WHERE id = %s", (from_id,))
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "id": msg_id, "time": created_at.strftime("%H:%M")})}

        # POST /social?action=send-file  (фото/видео/аудио/документ в чат)
        elif method == "POST" and action == "send-file":
            body = json.loads(event.get("body") or "{}")
            from_email = (body.get("from_email") or "").strip().lower()
            to_email = (body.get("to_email") or "").strip().lower()
            msg_type = (body.get("msg_type") or "image").strip()
            file_data = body.get("file") or ""
            mime = (body.get("mime") or "image/jpeg").strip()
            file_name = (body.get("file_name") or "file").strip()
            duration = (body.get("duration") or "").strip()

            from_id = get_user_id(cur, from_email)
            to_id = get_user_id(cur, to_email)
            if not from_id or not to_id or not file_data:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нет данных"})}

            if "," in file_data:
                file_data = file_data.split(",", 1)[1]
            file_bytes = base64.b64decode(file_data)
            ext = mime.split("/")[-1].replace("jpeg", "jpg")
            file_key = f"vainakh/chat/{uuid.uuid4().hex}.{ext}"
            s3 = get_s3()
            s3.put_object(Bucket="files", Key=file_key, Body=file_bytes, ContentType=mime)
            url = cdn_url(file_key)

            cur.execute(
                f"INSERT INTO {SCHEMA}.messages (from_user_id, to_user_id, text, msg_type, file_url, file_name, duration) VALUES (%s,%s,'',%s,%s,%s,%s) RETURNING id, created_at",
                (from_id, to_id, msg_type, url, file_name, duration or None)
            )
            msg_id, created_at = cur.fetchone()
            cur.execute(f"UPDATE {SCHEMA}.users SET last_seen = NOW() WHERE id = %s", (from_id,))
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({
                "ok": True, "id": msg_id, "time": created_at.strftime("%H:%M"),
                "file_url": url, "file_name": file_name,
            })}

        # POST /social?action=typing
        elif method == "POST" and action == "typing":
            body = json.loads(event.get("body") or "{}")
            from_email = (body.get("from_email") or "").strip().lower()
            to_email = (body.get("to_email") or "").strip().lower()
            from_id = get_user_id(cur, from_email)
            to_id = get_user_id(cur, to_email)
            if from_id and to_id:
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.typing (user_id, to_user_id, updated_at) VALUES (%s, %s, NOW())
                    ON CONFLICT (user_id) DO UPDATE SET to_user_id = %s, updated_at = NOW()
                """, (from_id, to_id, to_id))
                cur.execute(f"UPDATE {SCHEMA}.users SET last_seen = NOW() WHERE id = %s", (from_id,))
                conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        # POST /social?action=friend
        elif method == "POST" and action == "friend":
            body = json.loads(event.get("body") or "{}")
            from_email = (body.get("from_email") or "").strip().lower()
            to_email = (body.get("to_email") or "").strip().lower()
            fr_action = (body.get("fr_action") or "").strip()

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
            block_action = (body.get("block_action") or "block").strip()

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
                SELECT u.id, u.name, u.surname, u.city, u.email, u.avatar_url
                FROM {SCHEMA}.blocks b
                JOIN {SCHEMA}.users u ON b.blocked_id = u.id
                WHERE b.blocker_id = %s
                ORDER BY b.created_at DESC
            """, (my_id,))
            blocked = [{"id": r[0], "name": r[1] or "", "surname": r[2] or "", "city": r[3] or "",
                        "email": r[4], "avatar": (r[1] or "?")[0].upper(), "avatar_url": r[5] or ""} for r in cur.fetchall()]
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "blocked": blocked})}

        # GET /social?action=statuses&email=...
        elif method == "GET" and action == "statuses":
            email = (params.get("email") or "").strip().lower()
            my_id_for_block = None
            if email:
                my_id_for_block = get_user_id(cur, email)

            block_clause = ""
            if my_id_for_block:
                block_clause = f"AND u.id NOT IN (SELECT blocked_id FROM {SCHEMA}.blocks WHERE blocker_id = {my_id_for_block})"

            cur.execute(f"""
                SELECT s.id, s.type, s.content, s.file_url, s.color, s.emoji, s.created_at,
                       u.id, u.name, u.surname, u.avatar_url, s.group_id,
                       (SELECT COUNT(*) FROM {SCHEMA}.status_views sv WHERE sv.status_id = s.id) as view_count
                FROM {SCHEMA}.statuses s
                JOIN {SCHEMA}.users u ON s.user_id = u.id
                WHERE s.expires_at > NOW() {block_clause}
                ORDER BY s.created_at DESC
                LIMIT 100
            """)
            rows = cur.fetchall()
            statuses = [{
                "id": r[0], "type": r[1], "content": r[2], "file_url": r[3],
                "color": r[4], "emoji": r[5], "time": r[6].strftime("%H:%M"),
                "user_id": r[7], "user_name": r[8] or "", "user_surname": r[9] or "",
                "avatar_url": r[10], "group_id": r[11],
                "avatar": (r[8] or "?")[0].upper(),
                "is_mine": my_id_for_block is not None and r[7] == my_id_for_block,
                "view_count": r[12],
            } for r in rows]
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "statuses": statuses})}

        # POST /social?action=view-status  — отмечаем просмотр
        elif method == "POST" and action == "view-status":
            body = json.loads(event.get("body") or "{}")
            email = (body.get("email") or "").strip().lower()
            status_id = int(body.get("status_id") or 0)
            viewer_id = get_user_id(cur, email)
            if viewer_id and status_id:
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.status_views (status_id, viewer_id)
                    VALUES (%s, %s) ON CONFLICT DO NOTHING
                """, (status_id, viewer_id))
                conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        # GET /social?action=status-views&status_id=...&email=...
        elif method == "GET" and action == "status-views":
            status_id = int(params.get("status_id") or 0)
            email = (params.get("email") or "").strip().lower()
            my_id = get_user_id(cur, email)
            # Только автор может смотреть список просмотров
            cur.execute(f"SELECT user_id FROM {SCHEMA}.statuses WHERE id = %s", (status_id,))
            row = cur.fetchone()
            if not row or row[0] != my_id:
                return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Нет доступа"})}

            cur.execute(f"""
                SELECT u.id, u.name, u.surname, u.avatar_url, sv.viewed_at
                FROM {SCHEMA}.status_views sv
                JOIN {SCHEMA}.users u ON sv.viewer_id = u.id
                WHERE sv.status_id = %s
                ORDER BY sv.viewed_at DESC
            """, (status_id,))
            viewers = [{
                "id": r[0], "name": r[1] or "", "surname": r[2] or "",
                "avatar_url": r[3] or "", "avatar": (r[1] or "?")[0].upper(),
                "time": r[4].strftime("%H:%M"),
            } for r in cur.fetchall()]
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "viewers": viewers})}

        # POST /social?action=delete-status
        elif method == "POST" and action == "delete-status":
            body = json.loads(event.get("body") or "{}")
            email = (body.get("email") or "").strip().lower()
            status_id = int(body.get("status_id") or 0)
            my_id = get_user_id(cur, email)
            if my_id and status_id:
                cur.execute(f"UPDATE {SCHEMA}.statuses SET expires_at = NOW() WHERE id = %s AND user_id = %s", (status_id, my_id))
                conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        # GET /social?action=mutual-friends&my_email=...&other_email=...
        elif method == "GET" and action == "mutual-friends":
            my_email = (params.get("my_email") or "").strip().lower()
            other_email = (params.get("other_email") or "").strip().lower()
            my_id = get_user_id(cur, my_email)
            other_id = get_user_id(cur, other_email)
            if not my_id or not other_id:
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "mutual": []})}

            cur.execute(f"""
                SELECT u.id, u.name, u.surname, u.avatar_url, u.last_seen
                FROM {SCHEMA}.users u
                WHERE u.id IN (
                    SELECT CASE WHEN f.from_user_id = %s THEN f.to_user_id ELSE f.from_user_id END
                    FROM {SCHEMA}.friendships f
                    WHERE (f.from_user_id = %s OR f.to_user_id = %s) AND f.status = 'accepted'
                )
                AND u.id IN (
                    SELECT CASE WHEN f.from_user_id = %s THEN f.to_user_id ELSE f.from_user_id END
                    FROM {SCHEMA}.friendships f
                    WHERE (f.from_user_id = %s OR f.to_user_id = %s) AND f.status = 'accepted'
                )
                LIMIT 10
            """, (my_id, my_id, my_id, other_id, other_id, other_id))
            mutual = [{
                "id": r[0], "name": r[1] or "", "surname": r[2] or "",
                "avatar_url": r[3] or "", "avatar": (r[1] or "?")[0].upper(),
                "online": is_online(r[4]),
                "email": "",
            } for r in cur.fetchall()]
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "mutual": mutual})}

        # POST /social?action=upload  (аватар или статус)
        elif method == "POST" and action == "upload":
            body = json.loads(event.get("body") or "{}")
            upload_type = (body.get("upload_type") or "").strip()
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

        # POST /social?action=status-text
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