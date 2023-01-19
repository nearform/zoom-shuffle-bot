const defaultConfig = require('./postgrator.cjs')

module.exports = {
  ...defaultConfig,
  migrationPattern: 'db/population/*',
}
