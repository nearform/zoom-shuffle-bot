import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const algorithm = 'aes256'
const key = `${process.env.CLIENT_ID}.${process.env.CLIENT_SECRET}`
  .substr(0, 32)
  .padEnd(32)

export function encrypt(value) {
  const iv = randomBytes(16)
  const cipher = createCipheriv(algorithm, key, iv)

  const encrypted = cipher.update(value, 'utf8', 'hex') + cipher.final('hex')

  return `${iv.toString('hex')}:${encrypted}`
}

export function decrypt(value) {
  const [iv, data] = value.split(':')

  const decipher = createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'))

  return decipher.update(data, 'hex', 'utf8') + decipher.final('utf8')
}
