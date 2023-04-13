import buildServer from '../../server.js'

export default function getTestServer() {
  return buildServer({
    LOG_LEVEL: 'silent',
    PRETTY_PRINT: false,
    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
    BOT_JID: process.env.BOT_JID,
    SECRET_TOKEN: process.env.SECRET_TOKEN,
    REDIRECT_URL: process.env.REDIRECT_URL,
    FIRESTORE_COLLECTION: process.env.FIRESTORE_COLLECTION,
  })
}
