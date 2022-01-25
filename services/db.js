export async function getBotTokenData(client, accountId) {
  const result = await client.query(
    "SELECT * FROM tokens WHERE account_id = $1 AND token_type = 'bot'",
    [accountId]
  )

  if (result.rows.length === 0) {
    return undefined
  } else {
    return result.rows[0]
  }
}

export async function upsertBotTokenData(
  client,
  accountId,
  accessToken,
  expiresOn
) {
  return client.query(
    "INSERT INTO tokens(token_type, account_id, access_token, expires_on) VALUES('bot', $1, $2, $3) ON CONFLICT (token_type, account_id) DO UPDATE set access_token = $2, expires_on = $3",
    [accountId, accessToken, expiresOn]
  )
}

export async function getApiTokenData(client, accountId) {
  const result = await client.query(
    "SELECT * FROM tokens WHERE account_id = $1 AND token_type = 'api'",
    [accountId]
  )

  if (result.rows.length === 0) {
    return undefined
  } else {
    return result.rows[0]
  }
}

export async function upsertApiTokenData(
  client,
  accountId,
  accessToken,
  refreshToken,
  expiresOn
) {
  return client.query(
    "INSERT INTO tokens(token_type, account_id, access_token, refresh_token, expires_on) VALUES('api', $1, $2, $3, $4) ON CONFLICT (token_type, account_id) DO UPDATE set access_token = $2, refresh_token = $3, expires_on = $4",
    [accountId, accessToken, refreshToken, expiresOn]
  )
}

export async function addParticipant(
  client,
  meetingId,
  hostId,
  userId,
  participantName
) {
  return client.query(
    'INSERT INTO meetings(id, host_id, users, participants, date_added) VALUES($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET participants = meetings.participants || excluded.participants, users = meetings.users || excluded.users',
    [
      meetingId,
      hostId,
      JSON.stringify(userId ? [userId] : []),
      JSON.stringify([participantName]),
      new Date(),
    ]
  )
}

export async function removeParticipant(
  client,
  meetingId,
  userId,
  participantName
) {
  if (userId) {
    return client.query(
      'UPDATE ONLY meetings SET participants = participants - $3, users = users - $2 WHERE id = $1',
      [meetingId, userId, participantName]
    )
  } else {
    return client.query(
      'UPDATE ONLY meetings SET participants = participants - $2 WHERE id = $1',
      [meetingId, participantName]
    )
  }
}

export async function removeMeeting(client, meetingId) {
  return client.query('DELETE FROM meetings WHERE id = $1', [meetingId])
}

export async function getUserActiveMeeting(client, userId) {
  const result = await client.query(
    'SELECT id, participants FROM meetings WHERE users @> $1 ORDER BY date_added desc',
    [JSON.stringify([userId])]
  )

  if (result.rows.length === 0) {
    return undefined
  } else {
    return result.rows[0]
  }
}
