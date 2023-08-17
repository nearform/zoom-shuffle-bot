import fetch from 'node-fetch'
import createError from 'http-errors'
import { ZOOM_AUTH_BASE_URL } from '../const.js'

async function fetchToken(clientId, clientSecret, params) {
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    'base64',
  )

  const queryParams = new URLSearchParams(params)

  const response = await fetch(`${ZOOM_AUTH_BASE_URL}?${queryParams}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
    },
  })

  if (response.ok) {
    return response.json()
  } else {
    const { message } = await response.json()
    throw createError(response.status, message)
  }
}

export async function fetchTokenByCode(
  clientId,
  clientSecret,
  redirectUri,
  code,
) {
  return fetchToken(clientId, clientSecret, {
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  })
}

export async function fetchTokenByRefresh(
  clientId,
  clientSecret,
  refreshToken,
) {
  return fetchToken(clientId, clientSecret, {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })
}

export async function fetchTokenByCredentials(clientId, clientSecret) {
  return fetchToken(clientId, clientSecret, {
    grant_type: 'client_credentials',
  })
}
