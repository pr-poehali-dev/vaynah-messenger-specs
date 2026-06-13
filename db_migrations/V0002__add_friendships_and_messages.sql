CREATE TABLE t_p48581099_vaynah_messenger_spe.friendships (
    id SERIAL PRIMARY KEY,
    from_user_id INTEGER NOT NULL REFERENCES t_p48581099_vaynah_messenger_spe.users(id),
    to_user_id INTEGER NOT NULL REFERENCES t_p48581099_vaynah_messenger_spe.users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id),
    CHECK (from_user_id != to_user_id)
);

CREATE TABLE t_p48581099_vaynah_messenger_spe.messages (
    id SERIAL PRIMARY KEY,
    from_user_id INTEGER NOT NULL REFERENCES t_p48581099_vaynah_messenger_spe.users(id),
    to_user_id INTEGER NOT NULL REFERENCES t_p48581099_vaynah_messenger_spe.users(id),
    text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    CHECK (from_user_id != to_user_id)
);