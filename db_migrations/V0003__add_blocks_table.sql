CREATE TABLE t_p48581099_vaynah_messenger_spe.blocks (
    id SERIAL PRIMARY KEY,
    blocker_id INTEGER NOT NULL REFERENCES t_p48581099_vaynah_messenger_spe.users(id),
    blocked_id INTEGER NOT NULL REFERENCES t_p48581099_vaynah_messenger_spe.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id),
    CHECK (blocker_id != blocked_id)
);