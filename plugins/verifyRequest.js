import createError from 'http-errors'
import { createVerificationSignature } from '../helpers/crypto.js'

const TIMESTAMP_THRESHOLD = 5 * 60 * 1000 // 5 minutes

export default async function verifyRequest(req) {
  const timestamp = req.headers['x-zm-request-timestamp']

  if (Date.now() - Number(timestamp) >= TIMESTAMP_THRESHOLD) {
    throw createError(401)
  }

  const signature = createVerificationSignature(timestamp, req.body)

  if (signature !== req.headers['x-zm-signature']) {
    throw createError(401)
  }
}
