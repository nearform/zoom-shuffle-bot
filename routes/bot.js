import chatbot from '../services/zoom-chatbot.js'
import {
  getHostMeetingParticipants,
  getTokens,
  upsertTokens,
} from '../services/db.js'

export default async function (fastify) {
  fastify.post('/bot', async (req, res) => {
    try {
      const {
        command,
        payload: { toJid, userJid, accountId, userId },
      } = await chatbot.handle({
        body: req.body,
        headers: req.headers,
      })

      const tokens = await getTokens(fastify.pg, userId)

      if (tokens === undefined) {
        throw new Error('This app has not been installed for this Zoom user')
      }

      const { tokens: newTokens, zoomApp } = await chatbot.initialize(tokens)

      if (newTokens !== undefined && newTokens !== tokens) {
        await upsertTokens(fastify.pg, userId, newTokens)
      }

      const sendMessage = content => {
        return zoomApp.sendMessage({
          user_jid: userJid, // which user can see this message
          to_jid: toJid,
          account_id: accountId,
          content,
        })
      }

      if (command === 'participants') {
        const participants = await getHostMeetingParticipants(
          fastify.pg,
          userId
        )

        if (participants) {
          const randomParticipants = participants.sort(
            () => Math.random() - 0.5
          )

          await sendMessage({
            head: {
              text: 'Meeting participants',
            },
            body: [
              {
                type: 'message',
                text: randomParticipants.join('\n'),
              },
            ],
          })
        } else {
          await sendMessage({
            head: {
              text: "Sorry, you don't seem to be a host in any of the ongoing meetings.",
            },
          })
        }
      }

      res.code(200).send()
    } catch (error) {
      fastify.log.error(error)
      res.code(500).send()
    }
  })
}
