import dotenv from 'dotenv'
import buildServer from './server.js'

dotenv.config()

const server = buildServer({
  logger: process.env.LOGGER,
  dbUser: process.env.DB_USER,
  dbPassword: process.env.DB_PASSWORD,
  dbHost: process.env.DB_HOST,
  dbName: process.env.DB_NAME,
  dbPort: process.env.DB_PORT,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  botJid: process.env.BOT_JID,
  verificationToken: process.env.VERIFICATION_TOKEN,
  redirectUri: process.env.REDIRECT_URL,
})

const start = async () => {
  try {
    await server.listen(process.env.PORT, '0.0.0.0')
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
