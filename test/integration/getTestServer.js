import buildServer from '../../server.js'

export default function getTestServer() {
  return buildServer({
    log: false,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    botJid: process.env.BOT_JID,
    verificationToken: process.env.VERIFICATION_TOKEN,
    redirectUri: process.env.REDIRECT_URL,
    dbUser: process.env.DB_USER,
    dbPassword: process.env.DB_PASSWORD,
    dbPort: process.env.DB_PORT,
    dbHost: process.env.DB_HOST,
    dbName: process.env.DB_NAME,
  })
}
