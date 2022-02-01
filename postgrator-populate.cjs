const defaultConfig = require('./postgrator.cjs')

module.exports = {
  ...defaultConfig,
  migrationDirectory: 'db/population'
}
