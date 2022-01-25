import dotenv from 'dotenv'
import buildServer from './server.js'

dotenv.config()

const server = buildServer({
  logger: true,
  databaseUrl: process.env.DATABASE_URL,
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
