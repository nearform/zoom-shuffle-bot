import {
  addParticipant,
  removeMeeting,
  removeParticipant,
} from '../services/db.js'
import { encrypt } from '../helpers/crypto.js'

const EVENT_PARTICIPANT_LEFT = 'meeting.participant_left'
const EVENT_PARTICIPANT_JOINED = 'meeting.participant_joined'
const EVENT_MEETING_ENDED = 'meeting.ended'

export default async function (fastify) {
  fastify.post(
    '/hook',
    { onRequest: [fastify.zoom.verifyRequest] },
    async (req, res) => {
      const {
        event,
        payload: {
          object: { id: meeting_id, host_id, participant },
        },
      } = req.body

      if (event === EVENT_PARTICIPANT_JOINED) {
        await addParticipant(
          fastify.pg,
          meeting_id,
          host_id,
          participant.participant_user_id,
          encrypt(participant.user_name)
        )
      }

      if (event === EVENT_PARTICIPANT_LEFT) {
        await removeParticipant(
          fastify.pg,
          meeting_id,
          participant.participant_user_id,
          encrypt(participant.user_name)
        )
      }

      if (event === EVENT_MEETING_ENDED) {
        await removeMeeting(fastify.pg, meeting_id)
      }

      res.code(200).send()
    }
  )
}
