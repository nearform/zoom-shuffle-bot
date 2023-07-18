import { createVerificationSignature } from '../helpers/crypto.js'

import verifyRequest from './verifyRequest.js'

describe('verifyRequest()', () => {
  it('throws Unauthorized when using deprecated authorization token', async () => {
    await expect(async () => {
      await verifyRequest({ headers: { authorization: 'token' } })
    }).rejects.toThrow()
  })

  it('throws Unauthorized when the signature is invalid', async () => {
    await expect(async () => {
      await verifyRequest({
        headers: {
          'x-zm-request-timestamp': Date.now(),
          'x-zm-signature': '',
        },
        body: { foo: 'bar' },
      })
    }).rejects.toThrow()
  })

  it('throws Unauthorized when timestamp is >= 5 minutes after the header', async () => {
    const stamp = new Date()
    stamp.setMinutes(stamp.getMinutes() - 5)

    await expect(async () => {
      await verifyRequest({
        headers: {
          'x-zm-request-timestamp': stamp.valueOf(),
          'x-zm-signature': '', // signature not relevant here, timestamp check comes first
        },
        body: { foo: 'bar' },
      })
    }).rejects.toThrow()
  })

  it("doesn't throw when signature is valid", async () => {
    const body = { foo: 'bar' }
    const now = Date.now()
    const signature = createVerificationSignature(now, body)
    await expect(async () => {
      await verifyRequest({
        headers: {
          'x-zm-request-timestamp': now,
          'x-zm-signature': signature,
        },
        body,
      })
    }).not.toThrow()
  })
})
