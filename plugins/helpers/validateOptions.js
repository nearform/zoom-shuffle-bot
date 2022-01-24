export default function validateOptions(keys, options) {
  keys.forEach(key => {
    if (options[key] === undefined) {
      throw new Error(`Zoom plugin option \`${key}\` is required`)
    }
  })
}
