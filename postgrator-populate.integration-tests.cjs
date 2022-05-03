const defaultConfig = require('./postgrator.integration-tests.cjs')

module.exports = {
  ...defaultConfig,
  migrationDirectory: 'db/population'
}
