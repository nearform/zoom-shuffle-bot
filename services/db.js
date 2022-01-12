import moment from 'moment'

export async function getTokens(client, userId) {
  const result = await client.query('SELECT * FROM tokens WHERE user_id = $1', [
    userId,
  ])

  if (result.rows.length === 0) {
    return undefined
  } else {
    return result.rows[0]
  }
}

export async function upsertTokens(client, userId, tokens) {
  // TODO: drop the `moment` dependency and simply store a number of seconds (Date.now() / 1000)
  const expiresDate = moment().add(tokens.expires_in, 'seconds').format()

  return client.query(
    'INSERT INTO tokens(user_id, access_token, refresh_token, expires_date) VALUES($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE set access_token = $2, refresh_token = $3, expires_date = $4',
    [userId, tokens.access_token, tokens.refresh_token, expiresDate]
  )
}
