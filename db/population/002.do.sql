INSERT INTO tokens (
    account_id,
    token_type,
    access_token,
    refresh_token,
    expires_on
) VALUES (
    'test_account_id',
    'api',
    'test_api_access_token',
    'test_refresh_token',
    9999999999 /* far in the future */
);

INSERT INTO meetings (
    id,
    host_id,
    participants,
    users,
    date_added
) VALUES (
    'test_meeting_id',
    'test_host_id',
    '["680eda40e80d89c8b3d7fdfe074042e9"]', /* encrypted 'test_user' */
    '["test_user_id"]',
    CURRENT_TIMESTAMP
);
