import { getBotTokenData, upsertBotTokenData } from '../services/db.js'

import isTokenExpired from './helpers/isTokenExpired.js'
import getTokenExpiresOn from './helpers/getTokenExpiresOn.js'
import { fetchTokenByCredentials } from './oauth.js'
import apiFetch from './apiFetch.js'

async function getBotToken(fastify, options, accountId) {
  const tokenData = await getBotTokenData(fastify.pg, accountId)

  if (tokenData && !isTokenExpired(tokenData)) {
    return tokenData.access_token
  } else {
    const { access_token, expires_in } = await fetchTokenByCredentials(
      options.clientId,
      options.clientSecret
    )

    await upsertBotTokenData(
      fastify.pg,
      accountId,
      access_token,
      getTokenExpiresOn(expires_in)
    )

    return access_token
  }
}

export default async function sendBotMessage(
  fastify,
  options,
  { toJid, accountId, content, isMarkdown }
) {
  const token = await getBotToken(accountId)

  return apiFetch(token, '/im/chat/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      robot_jid: options.botJid,
      to_jid: toJid,
      account_id: accountId,
      content,
      is_markdown_support: isMarkdown,
    }),
  })
}
