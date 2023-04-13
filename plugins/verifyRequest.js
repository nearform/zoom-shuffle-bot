import createError from 'http-errors'
import { createVerificationSignature } from '../helpers/crypto.js'

export default async function verifyRequest(req) {
  const timestamp = req.headers['x-zm-request-timestamp']
  const signature = createVerificationSignature(timestamp, req.body)

  if (signature !== req.headers['x-zm-signature']) {
    throw createError(401)
  }
}
