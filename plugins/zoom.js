import fp from 'fastify-plugin'

import { getApiTokenData, upsertApiTokenData } from '../services/db.js'
import { fetchTokenByCode, fetchTokenByRefresh } from './oauth.js'
import validateOptions from './helpers/validateOptions.js'
import isTokenExpired from './helpers/isTokenExpired.js'
import getTokenExpiresOn from './helpers/getTokenExpiresOn.js'
import verifyRequest from './verifyRequest.js'
import sendBotMessage from './sendBotMessage.js'
import apiFetch from './apiFetch.js'

async function plugin(fastify, options = {}) {
  validateOptions(
    ['clientId', 'clientSecret', 'botJid', 'secretToken', 'redirectUri'],
    options
  )

  async function getApiToken(accountId) {
    const tokenData = await getApiTokenData(fastify.firestore, accountId)

    if (tokenData && !isTokenExpired(tokenData)) {
      return tokenData.accessToken
    } else {
      const { access_token, refresh_token, expires_in } =
        await fetchTokenByRefresh(
          options.clientId,
          options.clientSecret,
          tokenData.refreshToken
        )

      await upsertApiTokenData(
        fastify.firestore,
        accountId,
        access_token,
        refresh_token,
        getTokenExpiresOn(expires_in)
      )

      return access_token
    }
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
      fastify.firestore,
      account_id,
      access_token,
      refresh_token,
      getTokenExpiresOn(expires_in)
    )
  }

  fastify.decorate('zoom', {
    sendBotMessage: sendBotMessage.bind(null, fastify, options),
    verifyRequest,
    authorize,
    fetch: async (accountId, endpoint) => {
      const token = await getApiToken(accountId)

      return apiFetch(token, endpoint)
    },
  })
}

export default fp(plugin, {
  name: 'fastify-zoom',
  dependencies: ['zoom-firestore'],
})
