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
          'x-zm-request-timestamp': '123456789',
          'x-zm-signature': '',
        },
        body: { foo: 'bar' },
      })
    }).rejects.toThrow()
  })

  it("doesn't throw when signature is valid", async () => {
    await expect(async () => {
      await verifyRequest({
        headers: {
          'x-zm-request-timestamp': '123456789',
          'x-zm-signature':
            'v0=bf880720dd06b83aa1e9021397aa3a43092167e91f1ba379e92171f8639024f7',
        },
        body: { foo: 'bar' },
      })
    }).not.toThrow()
  })
})
