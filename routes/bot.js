import { getHostActiveMeeting } from '../services/db.js'

export default async function (fastify) {
  fastify.post(
    '/bot',
    { onRequest: [fastify.zoom.verifyRequest] },
    async (req, res) => {
      try {
        const {
          payload: { toJid, accountId, userId, cmd: command },
        } = req.body

        const sendMessage = content => {
          return fastify.zoom.sendMessage({
            toJid,
            accountId,
            content,
          })
        }

        if (command === 'list') {
          const meeting = await getHostActiveMeeting(fastify.pg, userId)

          if (meeting && meeting.participants.length > 0) {
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
        }

        res.code(200).send()
      } catch (error) {
        fastify.log.error(error)
        res.code(500).send()
      }
    }
  )
}
