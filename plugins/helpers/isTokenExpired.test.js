import isTokenExpired from './isTokenExpired.js'

const CURRENT_TIME_SEC = 1643033688

describe('isTokenExpired()', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(CURRENT_TIME_SEC * 1000))
  })

  it("returns true for a timestamp that's before now", () => {
    expect(isTokenExpired({ expiresOn: CURRENT_TIME_SEC - 10 })).toBe(true)
  })

  it("returns false for a timestamp that's now", () => {
    expect(isTokenExpired({ expiresOn: CURRENT_TIME_SEC })).toBe(true)
  })

  it("returns false for a timestamp that's after now", () => {
    expect(isTokenExpired({ expiresOn: CURRENT_TIME_SEC + 10 })).toBe(false)
  })
})
