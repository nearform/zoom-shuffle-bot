import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import isTokenExpired from './isTokenExpired.js'

const CURRENT_TIME_SEC = 1643033688

describe('isTokenExpired()', () => {
  beforeEach(() => {
    mock.timers.enable({
      apis: ['Date'],
      now: new Date(CURRENT_TIME_SEC * 1000),
    })
  })

  afterEach(() => {
    mock.timers.reset()
  })

  test("returns true for a timestamp that's before now", t => {
    t.assert.strictEqual(
      isTokenExpired({ expiresOn: CURRENT_TIME_SEC - 10 }),
      true,
    )
  })

  test("returns false for a timestamp that's now", t => {
    t.assert.strictEqual(isTokenExpired({ expiresOn: CURRENT_TIME_SEC }), true)
  })

  test("returns false for a timestamp that's after now", t => {
    t.assert.strictEqual(
      isTokenExpired({ expiresOn: CURRENT_TIME_SEC + 10 }),
      false,
    )
  })
})
