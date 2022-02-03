CREATE TABLE tokens(
    account_id TEXT NOT NULL,
    token_type TEXT CHECK (token_type IN ('bot', 'api')) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_on NUMERIC NOT NULL,
    PRIMARY KEY (account_id, token_type)
);

CREATE TABLE meetings(
    id TEXT PRIMARY KEY,
    host_id TEXT NOT NULL,
    participants JSONB,
    users JSONB,
    date_added TIMESTAMP
);
