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

  it('throws Unauthorized when verificationToken is invalid', async () => {
    await expect(async () => {
      await verifyRequest(
        { verificationToken: 'value1' },
        { headers: { authorization: 'value2' } }
      )
    }).rejects.toThrow()
  })

  it("doesn't throw when clientId and verificationToken are valid", async () => {
    await expect(async () => {
      await verifyRequest(
        { clientId: 'id', verificationToken: 'token' },
        { headers: { clientid: 'id', authorization: 'token' } }
      )
    }).not.toThrow()
  })
})
