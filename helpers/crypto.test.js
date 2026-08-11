import { test, describe } from 'node:test'
import { encrypt, decrypt } from './crypto.js'

describe('encrypt()', () => {
  test('returns an encrypted string', t => {
    const encrypted = encrypt('test')
    t.assert.strictEqual(encrypted, '05b1c3d9e5c8fdf16427af75c0b1db6c')
  })

  test('is reversible with decrypt()', t => {
    const decrypted = 'this particular string'

    const encrypted = encrypt(decrypted)

    t.assert.notStrictEqual(encrypted, decrypted)
    t.assert.strictEqual(decrypt(encrypted), decrypted)
  })
})
