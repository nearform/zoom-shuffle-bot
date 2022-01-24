import fp from 'fastify-plugin'
import fetch from 'node-fetch'
import createError from 'http-errors'

import {
  getApiTokenData,
  getBotTokenData,
  upsertApiTokenData,
  upsertBotTokenData,
} from '../services/db.js'
import {
  fetchTokenByCode,
  fetchTokenByCredentials,
  fetchTokenByRefresh,
} from './oauth.js'
import validateOptions from './helpers/validateOptions.js'
import isTokenExpired from './helpers/isTokenExpired.js'
import getTokenExpiresOn from './helpers/getTokenExpiresOn.js'
import verifyRequest from './verifyRequest.js'
import { ZOOM_API_BASE_URL } from '../const.js'

async function plugin(fastify, options = {}) {
  validateOptions(
    ['clientId', 'clientSecret', 'botJid', 'verificationToken', 'redirectUri'],
    options
  )

  async function getBotToken(accountId) {
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

  async function getApiToken(accountId) {
    const tokenData = await getApiTokenData(fastify.pg, accountId)

    if (tokenData && !isTokenExpired(tokenData)) {
      return tokenData.access_token
    } else {
      const { access_token, refresh_token, expires_in } =
        await fetchTokenByRefresh(
          options.clientId,
          options.clientSecret,
          tokenData.refresh_token
        )

      await upsertApiTokenData(
        fastify.pg,
        accountId,
        access_token,
        refresh_token,
        getTokenExpiresOn(expires_in)
      )

      return access_token
    }
  }

  async function sendBotMessage({ toJid, accountId, content, isMarkdown }) {
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

  async function authorize(code) {
    const { access_token, refresh_token, expires_in } = await fetchTokenByCode(
      options.clientId,
      options.clientSecret,
      options.redirectUri,
      code
    )

    const { account_id } = await apiFetch(access_token, '/users/me')

    await upsertApiTokenData(
      fastify.pg,
      account_id,
      access_token,
      refresh_token,
      getTokenExpiresOn(expires_in)
    )
  }

  async function apiFetch(token, endpoint, fetchOptions = {}) {
    const { headers = {} } = fetchOptions

    const response = await fetch(`${ZOOM_API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers: {
        Authorization: `Bearer ${token}`,
        ...headers,
      },
    })

    if (response.ok) {
      return response.json()
    } else {
      const { message } = await response.json()

      throw createError(response.status, message)
    }
  }

  fastify.decorate('zoom', {
    sendBotMessage,
    verifyRequest: verifyRequest.bind(null, options),
    authorize,
    fetch: async (accountId, endpoint) => {
      const token = await getApiToken(accountId)

      return apiFetch(token, endpoint)
    },
  })
}

export default fp(plugin, {
  name: 'fastify-zoom',
  dependencies: ['fastify-postgres'],
})
