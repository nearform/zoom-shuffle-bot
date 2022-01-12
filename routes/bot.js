import chatbot from '../services/zoom-chatbot.js'
import { fetchMeeting, fetchUserMeetings } from '../services/zoom-metrics.js'
import { getTokens, upsertTokens } from '../services/db.js'

export default async function (fastify) {
  fastify.post('/bot', async (req, res) => {
    try {
      const {
        command,
        payload: { toJid, userJid, accountId, userId, actionItem },
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

      const { email: user_email } = await zoomApp.request({
        url: '/v2/users/me',
        method: 'get',
      })

      const sendMessage = content => {
        return zoomApp.sendMessage({
          user_jid: userJid, // which user can see this message
          to_jid: toJid,
          account_id: accountId,
          content,
        })
      }

      if (command === 'meetings') {
        const meetings = await fetchUserMeetings(user_email)

        const messageItems = meetings.map(meeting => ({
          text: meeting.topic,
          value: `meeting/${meeting.id}`,
        }))

        await sendMessage({
          head: {
            text: 'Meetings',
            sub_head: {
              text: 'select one meeting to see info',
            },
          },
          body: [
            {
              type: 'actions',
              items: messageItems,
            },
          ],
        })
      }

      if (actionItem && actionItem.value.startsWith('meeting/')) {
        const [, meetingId] = actionItem.value.split('/')

        const response = await fetchMeeting(meetingId)

        // TODO: this is actually a 404 -> handle it within a try/catch
        if (response?.code === 3001) {
          await sendMessage({
            head: {
              text: 'Meeting participants',
            },
            body: [
              {
                type: 'message',
                text: response.message,
              },
            ],
          })

          return res.code(500).send({})
        }

        // remove duplicates in case of a possible API bug, or someone joining the meeting from multiple devices
        const uniqueParticipants = [
          ...new Set(response.participants.map(p => p.user_name)),
        ]

        const randomParticipants = uniqueParticipants.sort(
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
      }

      res.code(200).send({})
    } catch (error) {
      fastify.log.error(error)
      res.code(500).send({})
    }
  })
}
