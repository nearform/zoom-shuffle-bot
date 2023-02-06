import createError from 'http-errors'
import { createVerificationSignature } from '../helpers/crypto.js'

export default async function verifyRequest(pluginOptions, req) {
  const { clientid } = req.headers
  const timestamp = req.headers['x-zm-request-timestamp']
  const signature = createVerificationSignature(timestamp, req.body)

  if (
    clientid !== pluginOptions.clientId ||
    signature !== req.headers['x-zm-signature']
  ) {
    throw createError(401)
  }
}
