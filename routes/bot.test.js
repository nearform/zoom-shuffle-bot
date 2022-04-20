import fastify from 'fastify'
import * as db from '../services/db.js'
import bot from './bot.js'
import { encrypt } from '../helpers/crypto.js'

describe('bot route', () => {
  let server

  const mockSendBotMessage = jest.fn()
  const mockFetch = jest.fn()
  const mockPg = jest.fn()
  // eslint-disable-next-line no-import-assign
  db.getUserActiveMeeting = jest.fn()

  beforeAll(async () => {
    server = fastify()
    server.decorate('zoom', {
      verifyRequest: async () => {},
      sendBotMessage: mockSendBotMessage,
      fetch: mockFetch,
    })
    server.decorate('pg', mockPg)
    server.register(bot)
    await server.ready()
  })

  beforeEach(() => {
    jest.setTimeout(10e4)
    jest.resetAllMocks()
  })

  afterAll(async () => server.close())

  it('returns message when there are no ongoing message', async () => {
    db.getUserActiveMeeting.mockImplementation(() => ({
      participants: [encrypt('Andrej Stas')],
      id: 123,
    }))
    mockFetch.mockImplementation(async () => ({
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

    console.log('response', response)

    expect(true).toBeTruthy()
    expect(db.getUserActiveMeeting).toBeCalledWith(mockPg, '1239999')
    expect(mockSendBotMessage).toHaveBeenNthCalledWith(1, {
      accountId: '999999999',
      content: {
        head: {
          text: `You're currently in *Super zoom call*.\nHere's a random list of its 1 participants:`,
        },
      },
      toJid: '123abcd',
      isMarkdown: true,
    })
    expect(mockSendBotMessage).toHaveBeenNthCalledWith(2, {
      accountId: '999999999',
      content: {
        body: [
          {
            type: 'message',
            text: 'Andrej Stas',
          },
        ],
      },
      toJid: '123abcd',
      isMarkdown: undefined,
    })
  })
})
