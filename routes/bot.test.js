import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import fastify from 'fastify'
import bot from './bot.js'
import { encrypt } from '../helpers/crypto.js'

const mockSendBotMessage = mock.fn()
const mockFetch = mock.fn()

const createFirestoreMock = meetingData => ({
  doc: mock.fn(() => ({
    collection: mock.fn(() => ({
      where: mock.fn(() => ({
        orderBy: mock.fn(() => ({
          limit: mock.fn(() => ({
            get: mock.fn(async () => ({
              empty: meetingData === undefined,
              docs: meetingData
                ? [{ id: meetingData.id, data: () => meetingData }]
                : [],
            })),
          })),
        })),
      })),
    })),
  })),
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
    server.register(bot)
    await server.ready()
    mockSendBotMessage.mock.resetCalls()
    mockFetch.mock.resetCalls()
  })

  afterEach(async () => {
    await server.close()
  })

  test('returns a random list of all participants', async t => {
    const meetingData = {
      id: 123,
      participants: ['John Doe', 'Jane Smith', 'Andrej Staš'].map(name =>
        encrypt(name),
      ),
    }
    server.firestore = createFirestoreMock(meetingData)
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
    t.assert.deepStrictEqual(
      server.firestore.doc.mock.calls[0].arguments[0],
      'meeting',
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
  })

  test('returns a random list of participants using the "skipme" command', async t => {
    const meetingData = {
      id: 123,
      participants: ['John Doe', 'Jane Smith', 'Andrej Staš'].map(name =>
        encrypt(name),
      ),
    }
    server.firestore = createFirestoreMock(meetingData)
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
  })

  test('returns status 500 when error occurred during handling the request', async t => {
    server.firestore = {
      doc: mock.fn(() => {
        throw new Error('Firestore error')
      }),
    }
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
