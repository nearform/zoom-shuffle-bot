import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import getTokenExpiresOn from './getTokenExpiresOn.js'

const CURRENT_TIME_SEC = 1643033688

describe('getTokenExpiresOn()', () => {
  beforeEach(() => {
    mock.timers.enable({
      apis: ['Date'],
      now: new Date(CURRENT_TIME_SEC * 1000),
    })
  })

  afterEach(() => {
    mock.timers.reset()
  })

  test('returns a unix timestamp (number of seconds)', t => {
    t.assert.strictEqual(getTokenExpiresOn(3000), CURRENT_TIME_SEC + 3000)
  })
})
