import { test, describe, beforeEach, afterEach, mock } from 'node:test'
import fastify from 'fastify'
import * as db from '../services/db.js'
import bot from './bot.js'
import { encrypt } from '../helpers/crypto.js'

describe('/bot route', () => {
  let server
  const mockSendBotMessage = mock.fn()
  const mockFetch = mock.fn()
  const mockFirestore = mock.fn()
  // eslint-disable-next-line no-import-assign
  db.getUserActiveMeeting = mock.fn()

  beforeEach(async () => {
    server = fastify()
    server.decorate('zoom', {
      verifyRequest: async () => {},
      sendBotMessage: mockSendBotMessage,
      fetch: mockFetch,
    })
    server.decorate('firestore', mockFirestore)
    server.register(bot)
    await server.ready()
    mockSendBotMessage.mock.resetCalls()
    mockFetch.mock.resetCalls()
  })

  afterEach(async () => {
    await server.close()
  })

  test('returns a random list of all participants', async t => {
    db.getUserActiveMeeting.mock.mockImplementation(() => ({
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
    t.assert.deepStrictEqual(db.getUserActiveMeeting.mock.calls[0].arguments, [
      mockFirestore,
      '1239999',
    ])
    t.assert.deepStrictEqual(mockSendBotMessage.mock.calls[0].arguments[0], {
      accountId: '999999999',
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
      content: {
        body: [
          {
            type: 'message',
            text: 'Andrej Staš\n' + 'Jane Smith\n' + 'John Doe',
          },
        ],
      },
      toJid: '123abcd',
      isMarkdown: undefined,
    })
  })

  test('returns a random list of participants using the "skipme" command (excludes the person who created the list)', async t => {
    db.getUserActiveMeeting.mock.mockImplementation(() => ({
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
    t.assert.deepStrictEqual(db.getUserActiveMeeting.mock.calls[0].arguments, [
      mockFirestore,
      '1239999',
    ])
    t.assert.deepStrictEqual(mockSendBotMessage.mock.calls[0].arguments[0], {
      accountId: '999999999',
      content: {
        head: {
          text: `You're currently in *Super zoom call*.\nHere's a random list of its 2 participants:`,
        },
      },
      toJid: '123abcd',
      isMarkdown: true,
    })
    t.assert.deepStrictEqual(mockSendBotMessage.mock.calls[1].arguments[0], {
      accountId: '999999999',
      content: {
        body: [
          {
            type: 'message',
            text: 'Jane Smith\n' + 'John Doe',
          },
        ],
      },
      toJid: '123abcd',
      isMarkdown: undefined,
    })
  })

  test('returns info that the list is empty because there is only 1 participant and he was excluded by using "skipme" command', async t => {
    db.getUserActiveMeeting.mock.mockImplementation(() => ({
      participants: ['Andrej Staš'].map(name => encrypt(name)),
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
    t.assert.deepStrictEqual(db.getUserActiveMeeting.mock.calls[0].arguments, [
      mockFirestore,
      '1239999',
    ])
    t.assert.deepStrictEqual(mockSendBotMessage.mock.calls[0].arguments[0], {
      accountId: '999999999',
      content: {
        head: {
          text: `You're currently in *Super zoom call*.\nSorry, there are no other participants at the moment.`,
        },
      },
      toJid: '123abcd',
      isMarkdown: true,
    })
  })

  test('returns info there is no ongoing meeting', async t => {
    db.getUserActiveMeeting.mock.mockImplementation(() => undefined)

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
    t.assert.deepStrictEqual(db.getUserActiveMeeting.mock.calls[0].arguments, [
      mockFirestore,
      '1239999',
    ])
    t.assert.deepStrictEqual(mockSendBotMessage.mock.calls[0].arguments[0], {
      accountId: '999999999',
      content: {
        head: {
          text: `Sorry, you don't seem to be participating in any of the ongoing meetings.`,
        },
      },
      toJid: '123abcd',
      isMarkdown: undefined,
    })
  })

  test('returns status 500 when error occurred during handling the request', async t => {
    db.getUserActiveMeeting.mock.mockImplementation(() => new Error())
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
