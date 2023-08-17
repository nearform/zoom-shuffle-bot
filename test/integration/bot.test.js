import getTestServer from './getTestServer.js'
import resetDatabase from './resetDatabase.js'

import sendBotMessage from '../../plugins/sendBotMessage.js'
import apiFetch from '../../plugins/apiFetch.js'
import { createVerificationSignature } from '../../helpers/crypto.js'

jest.mock('../../plugins/sendBotMessage.js')
jest.mock('../../plugins/apiFetch.js')

const server = getTestServer()

expect.extend({
  botMessageContaining(received, value) {
    return { pass: JSON.stringify(received).includes(value) }
  },
})

let timestamp = 0

describe('/bot route verification', () => {
  beforeEach(() => {
    timestamp = Math.floor(Date.now() / 1000)
  })

  it('responds with 401 when not verified', async () => {
    const response = await server.inject({ url: '/bot', method: 'POST' })

    expect(response.statusCode).toBe(401)
  })

  it('responds with 200 when verified', async () => {
    const payload = {
      payload: {},
    }
    const response = await server.inject({
      url: '/bot',
      method: 'POST',
      headers: {
        clientid: process.env.CLIENT_ID,
        'x-zm-request-timestamp': timestamp,
        'x-zm-signature': createVerificationSignature(timestamp, payload),
      },
      payload,
    })

    expect(response.statusCode).toBe(200)
  })
})

describe('/bot route logic', () => {
  beforeEach(async () => {
    await resetDatabase(server)
    timestamp = Math.floor(Date.now() / 1000)
  })

  it('ignores an unknown command', async () => {
    expect(sendBotMessage).not.toHaveBeenCalled()

    const payload = {
      payload: {
        userId: 'non-existing-id',
        cmd: 'an-unknown-command',
      },
    }
    const response = await server.inject({
      url: '/bot',
      method: 'POST',
      headers: {
        clientid: process.env.CLIENT_ID,
        'x-zm-request-timestamp': timestamp,
        'x-zm-signature': createVerificationSignature(timestamp, payload),
      },
      payload,
    })

    expect(response.statusCode).toBe(200)

    expect(sendBotMessage).toHaveBeenCalledTimes(0)
  })

  it('sends a bot message when user has no active meetings', async () => {
    expect(sendBotMessage).not.toHaveBeenCalled()

    const payload = {
      payload: {
        userId: 'non-existing-id',
        cmd: '',
      },
    }
    const response = await server.inject({
      url: '/bot',
      method: 'POST',
      headers: {
        clientid: process.env.CLIENT_ID,
        'x-zm-request-timestamp': timestamp,
        'x-zm-signature': createVerificationSignature(timestamp, payload),
      },
      payload,
    })

    expect(response.statusCode).toBe(200)

    expect(sendBotMessage).toHaveBeenCalledTimes(1)
    expect(sendBotMessage).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.anything(),
      expect.botMessageContaining("Sorry, you don't seem"),
    )
  })

  it('sends a bot message with meeting topic and decoded user names when user has an active meeting', async () => {
    expect(sendBotMessage).not.toHaveBeenCalled()
    expect(apiFetch).not.toHaveBeenCalled()

    apiFetch.mockResolvedValueOnce({ topic: 'Test meeting topic' })

    const payload = {
      payload: {
        accountId: 'test_account_id',
        userId: 'test_user_id',
        cmd: '',
      },
    }
    const response = await server.inject({
      url: '/bot',
      method: 'POST',
      headers: {
        clientid: process.env.CLIENT_ID,
        'x-zm-request-timestamp': timestamp,
        'x-zm-signature': createVerificationSignature(timestamp, payload),
      },
      payload,
    })

    expect(response.statusCode).toBe(200)

    expect(apiFetch).toHaveBeenCalledTimes(1)
    expect(sendBotMessage).toHaveBeenCalledTimes(2)
    expect(sendBotMessage).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.anything(),
      expect.botMessageContaining('Test meeting topic'),
    )
    expect(sendBotMessage).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.anything(),
      expect.botMessageContaining('test_user'),
    )
  })
})
