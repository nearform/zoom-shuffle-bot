import createError from 'http-errors'
import { createVerificationSignature } from '../helpers/crypto.js'

const TIMESTAMP_THRESHOLD = 5 * 60 * 1000 // 5 minutes

export default async function verifyRequest(req) {
  // header received from Zoom is in epoch (seconds) format,
  // need to convert before comparing
  const epochStamp = Number(req.headers['x-zm-request-timestamp'])

  if (isNaN(epochStamp)) {
    throw createError(401)
  }

  const timestamp = epochStamp * 1000

  if (Date.now() - timestamp >= TIMESTAMP_THRESHOLD) {
    throw createError(401)
  }

  const signature = createVerificationSignature(timestamp, req.body)

  if (signature !== req.headers['x-zm-signature']) {
    throw createError(401)
  }
}
