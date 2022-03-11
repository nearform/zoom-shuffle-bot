import { createCipheriv, createDecipheriv } from 'crypto'

const algorithm = 'aes256'
const key = `${process.env.CLIENT_ID}.${process.env.CLIENT_SECRET}`
  .substring(0, 32)
  .padEnd(32)

// a constant IV is fine for this usecase, since we basically need a reversible hash
const iv = key.substring(0, 16).padEnd(16)

export function encrypt(value) {
  const cipher = createCipheriv(algorithm, key, iv)

  return cipher.update(value, 'utf8', 'hex') + cipher.final('hex')
}

export function decrypt(value) {
  const decipher = createDecipheriv(algorithm, key, iv)

  return decipher.update(value, 'hex', 'utf8') + decipher.final('utf8')
}
