import getTokenExpiresOn from './getTokenExpiresOn.js'

const CURRENT_TIME_SEC = 1643033688

describe('getTokenExpiresOn()', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(CURRENT_TIME_SEC * 1000))
  })

  it('returns a unix timestamp (number of seconds)', () => {
    expect(getTokenExpiresOn(3000)).toBe(CURRENT_TIME_SEC + 3000)
  })
})
