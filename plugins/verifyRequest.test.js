import verifyRequest from './verifyRequest.js'

describe('verifyRequest()', () => {
  it('throws Unauthorized when clientId is invalid', () => {
    expect(() =>
      verifyRequest({ clientId: 'value1' }, { headers: { clientid: 'value2' } })
    ).toThrow()
  })

  it('throws Unauthorized when verificationToken is invalid', () => {
    expect(() =>
      verifyRequest(
        { verificationToken: 'value1' },
        { headers: { authorization: 'value2' } }
      )
    ).toThrow()
  })

  it("doesn't throw when clientId and verificationToken are valid", () => {
    expect(() =>
      verifyRequest(
        { clientId: 'id', verificationToken: 'token' },
        { headers: { clientid: 'id', authorization: 'token' } }
      )
    ).not.toThrow()
  })
})
