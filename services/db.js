export async function getTokenData(client, accountId) {
  const result = await client.query(
    'SELECT * FROM tokens WHERE account_id = $1',
    [accountId]
  )

  if (result.rows.length === 0) {
    return undefined
  } else {
    return result.rows[0]
  }
}

export async function upsertTokenData(
  client,
  accountId,
  accessToken,
  expiresOn
) {
  return client.query(
    'INSERT INTO tokens(account_id, access_token, expires_on) VALUES($1, $2, $3) ON CONFLICT (account_id) DO UPDATE set access_token = $2, expires_on = $3',
    [accountId, accessToken, expiresOn]
  )
}

export async function addParticipant(client, meeting, participant) {
  return client.query(
    'INSERT INTO meetings(id, topic, host_id, participants, date_added) VALUES($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET participants = meetings.participants || excluded.participants',
    [
      meeting.id,
      meeting.topic,
      meeting.host_id,
      JSON.stringify([participant]),
      new Date(),
    ]
  )
}

export async function removeParticipant(client, meetingId, participant) {
  return client.query(
    'UPDATE ONLY meetings SET participants = participants - $2 WHERE id = $1',
    [meetingId, participant]
  )
}

export async function removeMeeting(client, meetingId) {
  return client.query('DELETE FROM meetings WHERE id = $1', [meetingId])
}

export async function getHostActiveMeeting(client, hostId) {
  const result = await client.query(
    'SELECT topic, participants FROM meetings WHERE host_id = $1 ORDER BY date_added desc',
    [hostId]
  )

  if (result.rows.length === 0) {
    return undefined
  } else {
    return result.rows[0]
  }
}
