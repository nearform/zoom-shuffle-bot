import verifyRequest from './verifyRequest.js'

describe('verifyRequest()', () => {
  it('throws Unauthorized when clientId is invalid', async () => {
    await expect(
      async () =>
        await verifyRequest(
          { clientId: 'value1' },
          { headers: { clientid: 'value2' } }
        )
    ).rejects.toThrow()
  })

  it('throws Unauthorized when using deprecated authorization token', async () => {
    await expect(async () => {
      await verifyRequest(
        { clientId: 'id', secretToken: 'token' },
        { headers: { clientid: 'id', authorization: 'token' } }
      )
    }).rejects.toThrow()
  })

  it('throws Unauthorized when the signature is invalid', async () => {
    await expect(async () => {
      await verifyRequest(
        { clientId: 'id', secretToken: 'value1' },
        {
          headers: {
            clientid: 'id',
            'x-zm-request-timestamp': '123456789',
            'x-zm-signature': '',
          },
          body: { foo: 'bar' },
        }
      )
    }).rejects.toThrow()
  })

  it("doesn't throw when clientId and signature are valid", async () => {
    await expect(async () => {
      await verifyRequest(
        { clientId: 'id', secretToken: 'token' },
        {
          headers: {
            clientid: 'id',
            'x-zm-request-timestamp': '123456789',
            'x-zm-signature':
              'v0=bf880720dd06b83aa1e9021397aa3a43092167e91f1ba379e92171f8639024f7',
          },
          body: { foo: 'bar' },
        }
      )
    }).not.toThrow()
  })
})
