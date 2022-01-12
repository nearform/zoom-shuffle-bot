import { client, oauth2 } from '@zoomus/chatbot'

const chatbotClient = client(
  process.env.CLIENT_ID,
  process.env.VERIFICATION_TOKEN,
  process.env.ROBOT_JID // TODO: rename to BOT_JID
)

const oauth2Client = oauth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
)

async function register(code) {
  const connection = await oauth2Client.connectByCode(code)

  const zoomApp = chatbotClient.create({ auth: connection })

  const tokens = zoomApp.auth.getTokens()
  const me = await zoomApp.request({ url: '/v2/users/me', method: 'get' })

  return {
    userId: me.id,
    tokens,
  }
}

async function initialize(tokens) {
  const connection = await oauth2Client.connect()

  const zoomApp = chatbotClient.create({ auth: connection })

  await zoomApp.auth.setTokens(
    tokens.access_token,
    tokens.refresh_token,
    tokens.expires_date
  )

  // Verify if token is expired
  // TODO: check the stored expires_date instead
  try {
    await zoomApp.request({ url: '/v2/users/me', method: 'get' })

    return { tokens, zoomApp }
  } catch (error) {
    const newTokens = await zoomApp.auth.requestTokensByRefresh(
      tokens.refresh_token
    )

    await zoomApp.auth.setTokens(
      newTokens.access_token,
      newTokens.refresh_token,
      newTokens.expires_in
    )

    return { tokens: newTokens, zoomApp }
  }
}

const chatbot = {
  register,
  initialize,
  handle: chatbotClient.handle.bind(chatbotClient), // there's a lot of references to `this` that break if not bound
}

export default chatbot
