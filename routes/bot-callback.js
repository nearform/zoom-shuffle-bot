import chatbot from '../services/zoom-chatbot.js'
import { upsertTokens } from '../services/db.js'

export default async function (fastify) {
  // TOOO: rename to "register" / "install" / "authorize"
  fastify.get('/auth/bot-callback', async (req, res) => {
    try {
      let { code } = req.query

      const { userId, tokens } = await chatbot.register(code)

      await upsertTokens(fastify.pg, userId, tokens)

      res.redirect(
        `https://zoom.us/launch/chat?jid=robot_${process.env.ROBOT_JID}`
      )
    } catch (error) {
      fastify.log.error(error)
      res.send(error)
    }
  })
}
