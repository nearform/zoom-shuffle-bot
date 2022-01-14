CREATE TABLE tokens(account_id TEXT PRIMARY KEY, access_token TEXT NOT NULL, expires_on NUMERIC NOT NULL);
CREATE TABLE meetings(id TEXT PRIMARY KEY, topic TEXT NOT NULL, host_id TEXT NOT NULL, participants JSONB NOT NULL, date_added TIMESTAMP);
