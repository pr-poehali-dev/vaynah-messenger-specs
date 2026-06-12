CREATE TABLE IF NOT EXISTS t_p48581099_vaynah_messenger_spe.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) DEFAULT '',
    surname VARCHAR(100) DEFAULT '',
    city VARCHAR(100) DEFAULT '',
    birthdate DATE,
    about TEXT DEFAULT '',
    phone VARCHAR(50) DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p48581099_vaynah_messenger_spe.auth_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(4) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_codes_email ON t_p48581099_vaynah_messenger_spe.auth_codes(email);
CREATE INDEX IF NOT EXISTS idx_users_email ON t_p48581099_vaynah_messenger_spe.users(email);
