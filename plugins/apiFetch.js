import fetch from 'node-fetch'
import createError from 'http-errors'

import { ZOOM_API_BASE_URL } from '../const.js'

export default async function apiFetch(token, endpoint, fetchOptions = {}) {
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
