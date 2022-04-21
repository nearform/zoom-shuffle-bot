import { getUserActiveMeeting } from '../services/db.js'
import { decrypt } from '../helpers/crypto.js'
import { SUBCOMMANDS } from '../const.js'
import sortRandomly from '../helpers/sortRandomly.js'

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

        if (cmd === SUBCOMMANDS.SKIP_ME) {
          updatedParticipants = participants.filter(
            participant => participant !== userName
          )

          if (updatedParticipants.length === 0) {
            await sendMessage(
              {
                head: {
                  text: `You're currently in *${topic}*.\nSorry, there are no other participants at the moment.`,
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

        const randomParticipants = sortRandomly(updatedParticipants)

        await sendMessage(
          {
            head: {
              text: `You're currently in *${topic}*.\nHere's a random list of its ${updatedParticipants.length} participants:`,
            },
          },
          true
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
