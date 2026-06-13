-- Добавляем поля в таблицу messages для файлов
ALTER TABLE t_p48581099_vaynah_messenger_spe.messages
  ADD COLUMN IF NOT EXISTS msg_type VARCHAR(20) DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS file_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS file_name TEXT NULL,
  ADD COLUMN IF NOT EXISTS duration VARCHAR(20) NULL;

-- Онлайн статус пользователей
ALTER TABLE t_p48581099_vaynah_messenger_spe.users
  ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS is_typing_to INTEGER NULL;

-- Таблица "печатает"
CREATE TABLE IF NOT EXISTS t_p48581099_vaynah_messenger_spe.typing (
  user_id INTEGER PRIMARY KEY REFERENCES t_p48581099_vaynah_messenger_spe.users(id),
  to_user_id INTEGER NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);