CREATE TABLE tokens(
    account_id TEXT PRIMARY KEY,
    token_type TEXT CHECK (token_type IN ('bot', 'api')) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_on NUMERIC NOT NULL,
    CONSTRAINT unique_tokens UNIQUE (account_id, token_type)
);

CREATE TABLE meetings(
    id TEXT PRIMARY KEY,
    host_id TEXT NOT NULL,
    participants JSONB NOT NULL,
    date_added TIMESTAMP
);
