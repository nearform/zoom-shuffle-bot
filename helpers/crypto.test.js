import { test, describe } from 'node:test'
import { encrypt, decrypt } from './crypto.js'

describe('encrypt()', () => {
  test('returns an encrypted string', t => {
    const encrypted = encrypt('test')
    t.assert.ok(encrypted.length > 0)
    t.assert.notStrictEqual(encrypted, 'test')
  })

  test('is reversible with decrypt()', t => {
    const decrypted = 'this particular string'

    const encrypted = encrypt(decrypted)

    t.assert.notStrictEqual(encrypted, decrypted)
    t.assert.strictEqual(decrypt(encrypted), decrypted)
  })
})
