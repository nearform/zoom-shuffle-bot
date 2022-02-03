import buildServer from '../../server.js'

export default function getTestServer() {
  return buildServer({
    LOG_LEVEL: 'silent',
    PRETTY_PRINT: false,
    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
    BOT_JID: process.env.BOT_JID,
    VERIFICATION_TOKEN: process.env.VERIFICATION_TOKEN,
    REDIRECT_URL: process.env.REDIRECT_URL,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_PORT: process.env.DB_PORT,
    DB_HOST: process.env.DB_HOST,
    DB_NAME: process.env.DB_NAME,
  })
}
