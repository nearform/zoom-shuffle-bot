import { test, describe, beforeEach, mock } from 'node:test'
import getTestServer from './getTestServer.js'
import resetDatabase from './resetDatabase.js'
import { createVerificationSignature } from '../../helpers/crypto.js'

const server = getTestServer()

const mockSendBotMessage = mock.fn()
const mockApiFetch = mock.fn()

// Mock the module exports
mock.module('../../plugins/sendBotMessage.js', {
  exports: { default: mockSendBotMessage },
})
mock.module('../../plugins/apiFetch.js', {
  exports: { default: mockApiFetch },
})

let timestamp = 0

describe('/bot route verification', () => {
  beforeEach(() => {
    timestamp = Math.floor(Date.now() / 1000)
  })

  test('responds with 401 when not verified', async t => {
    const response = await server.inject({ url: '/bot', method: 'POST' })

    t.assert.strictEqual(response.statusCode, 401)
  })

  test('responds with 200 when verified', async t => {
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

    t.assert.strictEqual(response.statusCode, 200)
  })
})

describe('/bot route logic', () => {
  beforeEach(async () => {
    await resetDatabase(server)
    timestamp = Math.floor(Date.now() / 1000)
    mockSendBotMessage.mock.resetCalls()
    mockApiFetch.mock.resetCalls()
  })

  test('ignores an unknown command', async t => {
    t.assert.strictEqual(mockSendBotMessage.mock.calls.length, 0)

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

    t.assert.strictEqual(response.statusCode, 200)

    t.assert.strictEqual(mockSendBotMessage.mock.calls.length, 0)
  })

  test('sends a bot message when user has no active meetings', async t => {
    t.assert.strictEqual(mockSendBotMessage.mock.calls.length, 0)

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

    t.assert.strictEqual(response.statusCode, 200)

    t.assert.strictEqual(mockSendBotMessage.mock.calls.length, 1)
    t.assert.strictEqual(
      mockSendBotMessage.mock.calls[0].arguments[2]("Sorry, you don't seem"),
      true,
    )
  })

  test('sends a bot message with meeting topic and decoded user names when user has an active meeting', async t => {
    t.assert.strictEqual(mockSendBotMessage.mock.calls.length, 0)
    t.assert.strictEqual(mockApiFetch.mock.calls.length, 0)

    mockApiFetch.mock.mockImplementationOnce(() => ({
      topic: 'Test meeting topic',
    }))

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

    t.assert.strictEqual(response.statusCode, 200)

    t.assert.strictEqual(mockApiFetch.mock.calls.length, 1)
    t.assert.strictEqual(mockSendBotMessage.mock.calls.length, 2)
    t.assert.strictEqual(
      mockSendBotMessage.mock.calls[0].arguments[2]('Test meeting topic'),
      true,
    )
    t.assert.strictEqual(
      mockSendBotMessage.mock.calls[1].arguments[2]('test_user'),
      true,
    )
  })
})
