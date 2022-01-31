require('dotenv').config()

module.exports = {
  migrationDirectory: 'db/migrations',
  driver: 'pg',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: false,
}
