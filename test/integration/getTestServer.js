import buildServer from '../../server.js'

export default function getTestServer() {
  return buildServer({
    log: false,
    databaseUrl: process.env.DATABASE_URL,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    botJid: process.env.BOT_JID,
    verificationToken: process.env.VERIFICATION_TOKEN,
    redirectUri: process.env.REDIRECT_URL,
  })
}
