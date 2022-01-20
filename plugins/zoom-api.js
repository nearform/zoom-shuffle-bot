import fp from 'fastify-plugin'
import fetch from 'node-fetch'
import createError from 'http-errors'
import { getApiTokenData, upsertApiTokenData } from '../services/db.js'

const BASE_URL = 'https://api.zoom.us/v2'

async function fetchToken(clientId, clientSecret, redirectUri, code) {
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    'base64'
  )

  const queryParams = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  })

  const response = await fetch(`https://zoom.us/oauth/token?${queryParams}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
    },
  })

  if (response.ok) {
    return response.json()
  } else {
    throw createError(response.status, await response.text())
  }
}

async function refreshToken(clientId, clientSecret, refreshToken) {
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    'base64'
  )

  const queryParams = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  const response = await fetch(`https://zoom.us/oauth/token?${queryParams}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
    },
  })

  if (response.ok) {
    return response.json()
  } else {
    throw createError(response.status, await response.text())
  }
}

function validateOptions(keys, options) {
  keys.forEach(key => {
    if (!options[key]) {
      throw new Error(`Zoom API plugin option \`${key}\` is required`)
    }
  })
}

async function plugin(fastify, options = {}) {
  validateOptions(['clientId', 'clientSecret', 'redirectUri'], options)

  async function authorize(code) {
    const { access_token, refresh_token, expires_in } = await fetchToken(
      options.clientId,
      options.clientSecret,
      options.redirectUri,
      code
    )

    const response = await fetch(`${BASE_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    if (response.ok) {
      const { account_id } = await response.json()

      const expiresOn = Date.now() / 1000 + expires_in

      await upsertApiTokenData(
        fastify.pg,
        account_id,
        access_token,
        refresh_token,
        expiresOn
      )
    } else {
      throw createError(response.status, await response.text())
    }
  }

  async function getToken(accountId) {
    const tokenData = await getApiTokenData(fastify.pg, accountId)

    if (tokenData && tokenData.expires_on > Date.now() / 1000) {
      return tokenData.access_token
    } else {
      const { access_token, refresh_token, expires_in } = await refreshToken(
        options.clientId,
        options.clientSecret,
        tokenData.refresh_token
      )

      const expiresOn = Date.now() / 1000 + expires_in

      await upsertApiTokenData(
        fastify.pg,
        accountId,
        access_token,
        refresh_token,
        expiresOn
      )

      return access_token
    }
  }

  async function apiFetch(accountId, endpoint) {
    const token = await getToken(accountId)

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      return response.json()
    } else {
      throw createError(response.status, await response.text())
    }
  }

  fastify.decorate('zoomApi', {
    authorize,
    fetch: apiFetch,
  })
}

export default fp(plugin, {
  name: 'fastify-zoom-api',
  dependencies: ['fastify-postgres'],
})
