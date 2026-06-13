-- Просмотры статусов
CREATE TABLE IF NOT EXISTS t_p48581099_vaynah_messenger_spe.status_views (
    id SERIAL PRIMARY KEY,
    status_id INTEGER NOT NULL,
    viewer_id INTEGER NOT NULL,
    viewed_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(status_id, viewer_id)
);

-- Группировка статусов (один «круг» = несколько слайдов)
ALTER TABLE t_p48581099_vaynah_messenger_spe.statuses
  ADD COLUMN IF NOT EXISTS group_id TEXT NULL;
