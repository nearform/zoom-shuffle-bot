import 'dotenv/config'
import { test, describe } from 'node:test'
import { createVerificationSignature } from '../helpers/crypto.js'
import verifyRequest from './verifyRequest.js'

describe('verifyRequest()', () => {
  test('throws unauthorized when using deprecated authorization token', async t => {
    await t.assert.rejects(
      async () => {
        await verifyRequest({ headers: { authorization: 'token' } })
      },
      { name: 'UnauthorizedError' },
    )
  })

  test('throws unauthorized when the signature is invalid', async t => {
    await t.assert.rejects(
      async () => {
        await verifyRequest({
          headers: {
            'x-zm-request-timestamp': Math.floor(Date.now() / 1000),
            'x-zm-signature': '',
          },
          body: { foo: 'bar' },
        })
      },
      { name: 'UnauthorizedError' },
    )
  })

  test('throws unauthorized when timestamp is >= 5 minutes after the header', async t => {
    const stamp = new Date()
    stamp.setMinutes(stamp.getMinutes() - 5)

    await t.assert.rejects(
      async () => {
        await verifyRequest({
          headers: {
            'x-zm-request-timestamp': Math.floor(stamp.valueOf() / 1000),
            'x-zm-signature': '',
          },
          body: { foo: 'bar' },
        })
      },
      { name: 'UnauthorizedError' },
    )
  })

  test('throws unauthorized when timestamp is non-numeric', async t => {
    await t.assert.rejects(
      async () => {
        await verifyRequest({
          headers: {
            'x-zm-request-timestamp': 'hang on a minute...',
            'x-zm-signature': '',
          },
          body: { foo: 'bar' },
        })
      },
      { name: 'UnauthorizedError' },
    )
  })

  test('does not throw unauthorized when signature is valid', async t => {
    const body = { foo: 'bar' }
    const epoch = Math.floor(Date.now() / 1000)

    const signature = createVerificationSignature(epoch, body)

    await t.assert.doesNotReject(async () => {
      await verifyRequest({
        headers: {
          'x-zm-request-timestamp': epoch,
          'x-zm-signature': signature,
        },
        body,
      })
    })
  })
})
