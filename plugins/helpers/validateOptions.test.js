import { test, describe } from 'node:test'
import validateOptions from './validateOptions.js'

const keys = ['option1', 'option2', 'option3']

describe('validateOptions()', () => {
  test('throws if a required key is missing', t => {
    t.assert.throws(() => validateOptions(keys, {}), /is required$/)
  })

  test("doesn't throw if all required keys are present", t => {
    t.assert.doesNotThrow(() =>
      validateOptions(keys, { option1: '', option2: null, option3: 1 }),
    )
  })
})
