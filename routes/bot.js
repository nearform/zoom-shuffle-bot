import { getHostActiveMeeting } from '../services/db.js'

export default async function (fastify) {
  fastify.post(
    '/bot',
    { onRequest: [fastify.zoom.verifyRequest] },
    async (req, res) => {
      try {
        const {
          payload: { toJid, accountId, userId },
        } = req.body

        const sendMessage = (content, isMarkdown) => {
          return fastify.zoom.sendMessage({
            toJid,
            accountId,
            content,
            isMarkdown,
          })
        }

        const meeting = await getHostActiveMeeting(fastify.pg, userId)

        if (meeting && meeting.participants.length > 0) {
          const { topic } = await fastify.zoomApi.fetch(
            accountId,
            `/meetings/${meeting.id}`
          )

          await sendMessage(
            {
              head: {
                text: `You're the host of *${topic}*.\nHere's a random list of its (${meeting.participants.length}) participants:`,
              },
            },
            true
          )

          const randomParticipants = meeting.participants.sort(
            () => Math.random() - 0.5
          )

          await sendMessage({
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

        res.code(200).send()
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error(error)
        } else {
          fastify.log.error(error.message)
        }
        res.code(500).send()
      }
    }
  )
}
