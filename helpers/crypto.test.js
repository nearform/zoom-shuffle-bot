import { encrypt, decrypt } from './crypto.js'

describe('encrypt()', () => {
  it('returns an encrypted string', () => {
    expect(encrypt('test')).toBe('05b1c3d9e5c8fdf16427af75c0b1db6c')
  })

  it('is reversible with decrypt()', () => {
    const decrypted = 'this particular string'

    const encrypted = encrypt(decrypted)

    expect(encrypted).not.toBe(decrypted)
    expect(decrypt(encrypted)).toBe(decrypted)
  })
})
