import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import fastify from 'fastify'
import { encrypt } from '../helpers/crypto.js'

const mockSendBotMessage = mock.fn()
const mockFetch = mock.fn()
const mockGetUserActiveMeeting = mock.fn()

// Mock the db module at the top level
mock.module('../services/db.js', {
  exports: { getUserActiveMeeting: mockGetUserActiveMeeting },
})
mock.module('../helpers/sortRandomly.js', {
  exports: { default: items => items.sort() },
})

describe('/bot route', () => {
  let server

  beforeEach(async () => {
    server = fastify()
    server.decorate('zoom', {
      verifyRequest: async () => {},
      sendBotMessage: mockSendBotMessage,
      fetch: mockFetch,
    })
    server.decorate('firestore', mock.fn())
    server.register(import('./bot.js'))
    await server.ready()
    mockSendBotMessage.mock.resetCalls()
    mockFetch.mock.resetCalls()
    mockGetUserActiveMeeting.mock.resetCalls()
  })

  afterEach(async () => {
    await server.close()
  })

  test('returns a random list of all participants', async t => {
    mockGetUserActiveMeeting.mock.mockImplementation(() => ({
      participants: ['John Doe', 'Jane Smith', 'Andrej Staš'].map(name =>
        encrypt(name),
      ),
      id: 123,
    }))
    mockFetch.mock.mockImplementation(async () => ({
      topic: 'Super zoom call',
    }))
    const response = await server.inject({
      method: 'POST',
      url: '/bot',
      body: {
        payload: {
          toJid: '123abcd',
          cmd: '',
          accountId: '999999999',
          userId: '1239999',
          userName: 'Andrej Staš',
        },
      },
    })

    t.assert.strictEqual(response.statusCode, 200)
    t.assert.strictEqual(
      mockGetUserActiveMeeting.mock.calls[0].arguments[1],
      '1239999',
    )
    t.assert.deepStrictEqual(mockSendBotMessage.mock.calls[0].arguments[0], {
      accountId: '999999999',
      userJid: undefined,
      content: {
        head: {
          text: `You're currently in *Super zoom call*.\nHere's a random list of its 3 participants:`,
        },
      },
      toJid: '123abcd',
      isMarkdown: true,
    })
    t.assert.deepStrictEqual(mockSendBotMessage.mock.calls[1].arguments[0], {
      accountId: '999999999',
      userJid: undefined,
      content: {
        body: [
          {
            type: 'message',
            text: 'Andrej Staš\nJane Smith\nJohn Doe',
          },
        ],
      },
      toJid: '123abcd',
      isMarkdown: undefined,
    })
  })

  test('returns a random list of participants using the "skipme" command', async t => {
    mockGetUserActiveMeeting.mock.mockImplementation(() => ({
      participants: ['John Doe', 'Jane Smith', 'Andrej Staš'].map(name =>
        encrypt(name),
      ),
      id: 123,
    }))
    mockFetch.mock.mockImplementation(async () => ({
      topic: 'Super zoom call',
    }))
    const response = await server.inject({
      method: 'POST',
      url: '/bot',
      body: {
        payload: {
          toJid: '123abcd',
          cmd: 'skipme',
          accountId: '999999999',
          userId: '1239999',
          userName: 'Andrej Staš',
        },
      },
    })

    t.assert.strictEqual(response.statusCode, 200)
    t.assert.strictEqual(
      mockGetUserActiveMeeting.mock.calls[0].arguments[1],
      '1239999',
    )
  })

  test('returns status 500 when error occurred during handling the request', async t => {
    mockGetUserActiveMeeting.mock.mockImplementation(() => {
      throw new Error()
    })
    const response = await server.inject({
      method: 'POST',
      url: '/bot',
      body: {
        payload: {
          toJid: '123abcd',
          cmd: '',
          accountId: '999999999',
          userId: '1239999',
          userName: 'Andrej Staš',
        },
      },
    })

    t.assert.strictEqual(response.statusCode, 500)
  })
})
