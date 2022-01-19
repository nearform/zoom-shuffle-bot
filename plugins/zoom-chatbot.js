import fp from 'fastify-plugin'
import fetch from 'node-fetch'
import createError from 'http-errors'

import { getBotTokenData, upsertBotTokenData } from '../services/db.js'

async function fetchToken(clientId, clientSecret) {
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    'base64'
  )

  const response = await fetch(
    'https://zoom.us/oauth/token?grant_type=client_credentials',
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
      },
    }
  )

  return response.json()
}

function validateOptions(keys, options) {
  keys.forEach(key => {
    if (!options[key]) {
      throw new Error(`Zoom Chatbot plugin option \`${key}\` is required`)
    }
  })
}

async function plugin(fastify, options = {}) {
  validateOptions(
    ['clientId', 'clientSecret', 'botJid', 'verificationToken'],
    options
  )

  async function getToken(accountId) {
    const tokenData = await getBotTokenData(fastify.pg, accountId)

    if (tokenData && tokenData.expires_on > Date.now() / 1000) {
      return tokenData.access_token
    } else {
      const { access_token, expires_in } = await fetchToken(
        options.clientId,
        options.clientSecret
      )

      const expiresOn = Date.now() / 1000 + expires_in

      await upsertBotTokenData(fastify.pg, accountId, access_token, expiresOn)

      return access_token
    }
  }

  async function sendMessage({ toJid, accountId, content, isMarkdown }) {
    const token = await getToken(accountId)

    return fetch('https://api.zoom.us/v2/im/chat/messages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
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

  async function verifyRequest(req) {
    const { clientid, authorization } = req.headers

    if (
      clientid !== options.clientId ||
      authorization !== options.verificationToken
    ) {
      throw createError(401)
    }
  }

  fastify.decorate('zoom', {
    sendMessage,
    verifyRequest,
  })
}

export default fp(plugin, {
  name: 'fastify-zoom-chatbot',
  dependencies: ['fastify-postgres'],
})
