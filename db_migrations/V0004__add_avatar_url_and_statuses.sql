ALTER TABLE t_p48581099_vaynah_messenger_spe.users ADD COLUMN IF NOT EXISTS avatar_url TEXT NULL;

CREATE TABLE IF NOT EXISTS t_p48581099_vaynah_messenger_spe.statuses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p48581099_vaynah_messenger_spe.users(id),
    type VARCHAR(20) NOT NULL DEFAULT 'text',
    content TEXT NOT NULL DEFAULT '',
    file_url TEXT NULL,
    color VARCHAR(100) NULL,
    emoji VARCHAR(10) NULL,
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMP DEFAULT NOW()
);