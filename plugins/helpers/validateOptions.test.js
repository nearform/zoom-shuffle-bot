import validateOptions from './validateOptions.js'

const keys = ['option1', 'option2', 'option3']

describe('validateOptions()', () => {
  it('throws if a required key is missing', () => {
    expect(() => validateOptions(keys, {})).toThrow(/is required$/)
  })

  it("doesn't throw if all required keys are present", () => {
    expect(() =>
      validateOptions(keys, { option1: '', option2: null, option3: 1 })
    ).not.toThrow()
  })
})
