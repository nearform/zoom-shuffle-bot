import { getUserActiveMeeting } from '../services/db.js'
import { decrypt } from '../helpers/crypto.js'
import { USAGE_HINTS } from '../const.js'

export default async function (fastify) {
  fastify.post(
    '/bot',
    { onRequest: [fastify.zoom.verifyRequest] },
    async (req, res) => {
      try {
        const {
          payload: { toJid, accountId, userId, cmd, userName },
        } = req.body

        const sendMessage = (content, isMarkdown) => {
          return fastify.zoom.sendBotMessage({
            toJid,
            accountId,
            content,
            isMarkdown,
          })
        }

        const meeting = await getUserActiveMeeting(fastify.pg, userId)

        if (!meeting || meeting.participants.length === 0) {
          await sendMessage({
            head: {
              text: "Sorry, you don't seem to be participating in any of the ongoing meetings.",
            },
          })
          res.code(200).send()
          return
        }

        const { topic } = await fastify.zoom.fetch(
          accountId,
          `/meetings/${meeting.id}`
        )

        const participants = meeting.participants.map(participant =>
          decrypt(participant)
        )
        let updatedParticipants

        if (cmd === USAGE_HINTS.SKIP_ME) {
          updatedParticipants = participants.filter(
            participant => participant !== userName
          )

          if (participants.length === 0) {
            await sendMessage(
              {
                head: {
                  text: `You're currently in *${topic}*.\nThere are no other participants at the moment.`,
                },
              },
              true
            )
            res.code(200).send()
            return
          }
        } else {
          updatedParticipants = participants
        }

        await sendMessage(
          {
            head: {
              text: `You're currently in *${topic}*.\nHere's a random list of its ${meeting.participants.length} participants:`,
            },
          },
          true
        )

        const randomParticipants = updatedParticipants.sort(
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

        res.code(200).send()
      } catch (error) {
        fastify.log.error(error)
        res.code(500).send()
      }
    }
  )
}
