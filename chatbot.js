import { oauth2, client } from '@zoomus/chatbot'
import moment from 'moment'
import fetch from 'node-fetch'
import fastify from 'fastify'
import pg from 'fastify-postgres'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()
const oauth2Client = oauth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
)
const chatbot = client(
  process.env.CLIENT_ID,
  process.env.VERIFICATION_TOKEN,
  process.env.ROBOT_JID
).defaultAuth(oauth2Client.connect())

const server = fastify({ logger: true })

server.register(pg, {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
})

server.get('/healthcheck', async () => 'ok')

server.get('/auth/bot-callback', async (req, res) => {
  try {
    let { code } = req.query

    let connection = await oauth2Client.connectByCode(code)
    let zoomApp = chatbot.create({ auth: connection })
    let tokens = zoomApp.auth.getTokens()
    let me = await zoomApp.request({ url: '/v2/users/me', method: 'get' })

    await upsertTokens(me.id, tokens)

    res.redirect(
      `https://zoom.us/launch/chat?jid=robot_${process.env.ROBOT_JID}`
    )
  } catch (error) {
    console.log(error)
    res.send(error)
  }
})

server.post('/bot', async function (req, res) {
  try {
    const jwtToken = getJWTToken()
    const data = await chatbot.handle({ body: req.body, headers: req.headers })
    const { command, payload } = data
    const { toJid, userJid, accountId, userId, actionItem } = payload

    const zoomApp = chatbot.create()

    let tokens = await getTokens(userId)

    if (tokens.rows.length === 0) {
      throw new Error('User not found')
    }

    tokens = tokens.rows[0]

    await zoomApp.auth.setTokens(
      tokens.access_token,
      tokens.refresh_token,
      tokens.expires_date
    )

    // Verify if token is expired
    try {
      await zoomApp.request({ url: '/v2/users/me', method: 'get' })
    } catch (e) {
      const newTokens = await zoomApp.auth.requestTokensByRefresh(
        tokens.refresh_token
      )
      await upsertTokens(userId, newTokens)
      await zoomApp.auth.setTokens(
        newTokens.access_token,
        newTokens.refresh_token,
        newTokens.expires_date
      )
    }

    const { email: user_email } = await zoomApp.request({
      url: '/v2/users/me',
      method: 'get',
    })
    console.log(user_email)

    if (command === 'meetings') {
      const response = await fetch('https://api.zoom.us/v2/metrics/meetings', {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      })

      let meetings = await response.json()

      console.log(meetings)

      meetings = meetings.meetings.filter(
        meeting => meeting.email === user_email
      )

      const resMeeting = meetings.map(meeting => ({
        text: meeting.topic,
        value: `meeting/${meeting.id}`,
      }))

      await zoomApp.sendMessage({
        user_jid: userJid, //which user can see this message
        to_jid: toJid,
        account_id: accountId,
        content: {
          head: {
            text: 'Meetings',
            sub_head: {
              text: 'select one meeting to see info',
            },
          },
          body: [
            {
              type: 'actions',
              items: resMeeting,
            },
          ],
        },
      })
    }

    if (actionItem && actionItem.value.startsWith('meeting/')) {
      const meetingId = actionItem.value.split('/')[1]

      const response = await fetch(
        `https://api.zoom.us/v2/metrics/meetings/${meetingId}/participants`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      )
      const participants = await response.json()

      console.log(participants)

      if (participants?.code === 3001) {
        await zoomApp.sendMessage({
          user_jid: userJid,
          to_jid: toJid,
          account_id: accountId,
          content: {
            head: {
              text: 'Meeting participants',
            },
            body: [
              {
                type: 'message',
                text: participants.message,
              },
            ],
          },
        })
        console.log(participants)
        return res.code(500).send({})
      }

      const randomParticipant = participants.participants
        .map(p => p.user_name)
        .sort(() => Math.random() - 0.5)
        .join('\n')
      console.log(randomParticipant)

      await zoomApp.sendMessage({
        user_jid: userJid,
        to_jid: toJid,
        account_id: accountId,
        content: {
          head: {
            text: 'Meeting participants',
          },
          body: [
            {
              type: 'message',
              text: randomParticipant,
            },
          ],
        },
      })
    }

    res.code(200).send({})
  } catch (e) {
    console.log(e)
    res.code(500).send({})
  }
})

async function getTokens(userId) {
  const dbClient = await server.pg.connect()

  const query = {
    text: 'SELECT * FROM tokens WHERE user_id = $1',
    values: [userId],
  }

  const res = await dbClient.query(query)
  dbClient.release()
  return res
}

async function upsertTokens(userId, tokens) {
  const dbClient = await server.pg.connect()

  const query = {
    text: 'INSERT INTO tokens(user_id, access_token, refresh_token, expires_date) VALUES($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE set access_token = $2, refresh_token = $3, expires_date = $4 ',
    values: [
      userId,
      tokens.access_token,
      tokens.refresh_token,
      moment().add(tokens.expires_in, 'seconds').format(),
    ],
  }

  await dbClient.query(query)
  dbClient.release()
}

function getJWTToken() {
  const payload = {
    iss: process.env.API_KEY,
    exp: new Date().getTime() + 5000,
  }

  return jwt.sign(payload, process.env.API_SECRET)
}

const start = async () => {
  try {
    await server.listen(process.env.PORT, '0.0.0.0')
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}
start()
