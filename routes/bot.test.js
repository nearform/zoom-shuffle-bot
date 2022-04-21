import fastify from 'fastify'
import * as db from '../services/db.js'
import bot from './bot.js'
import { encrypt } from '../helpers/crypto.js'

jest.mock('../helpers/sortRandomly.js', () => items => items.sort())

describe('/bot route', () => {
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
    jest.resetAllMocks()
  })

  afterAll(async () => server.close())

  it('returns a random list of all participants', async () => {
    db.getUserActiveMeeting.mockImplementation(() => ({
      participants: ['John Doe', 'Jane Smith', 'Andrej Staš'].map(name =>
        encrypt(name)
      ),
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

    expect(response.statusCode).toBe(200)
    expect(db.getUserActiveMeeting).toBeCalledWith(mockPg, '1239999')
    expect(mockSendBotMessage).toHaveBeenNthCalledWith(1, {
      accountId: '999999999',
      content: {
        head: {
          text: `You're currently in *Super zoom call*.\nHere's a random list of its 3 participants:`,
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
            text: 'Andrej Staš\n' + 'Jane Smith\n' + 'John Doe',
          },
        ],
      },
      toJid: '123abcd',
      isMarkdown: undefined,
    })
  })

  it('returns a random list of participants using the "skipme" command (excludes the person who created the list)', async () => {
    db.getUserActiveMeeting.mockImplementation(() => ({
      participants: ['John Doe', 'Jane Smith', 'Andrej Staš'].map(name =>
        encrypt(name)
      ),
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
          cmd: 'skipme',
          accountId: '999999999',
          userId: '1239999',
          userName: 'Andrej Staš',
        },
      },
    })

    expect(response.statusCode).toBe(200)
    expect(db.getUserActiveMeeting).toBeCalledWith(mockPg, '1239999')
    expect(mockSendBotMessage).toHaveBeenNthCalledWith(1, {
      accountId: '999999999',
      content: {
        head: {
          text: `You're currently in *Super zoom call*.\nHere's a random list of its 2 participants:`,
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
            text: 'Jane Smith\n' + 'John Doe',
          },
        ],
      },
      toJid: '123abcd',
      isMarkdown: undefined,
    })
  })

  it('returns info that the list is empty because there is only 1 participant and he was excluded by using "skipme" command', async () => {
    db.getUserActiveMeeting.mockImplementation(() => ({
      participants: ['Andrej Staš'].map(name => encrypt(name)),
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
          cmd: 'skipme',
          accountId: '999999999',
          userId: '1239999',
          userName: 'Andrej Staš',
        },
      },
    })

    expect(response.statusCode).toBe(200)
    expect(db.getUserActiveMeeting).toBeCalledWith(mockPg, '1239999')
    expect(mockSendBotMessage).toHaveBeenCalledWith({
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

  it('returns info there is no ongoing meeting', async () => {
    db.getUserActiveMeeting.mockImplementation(() => undefined)

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

    expect(response.statusCode).toBe(200)
    expect(db.getUserActiveMeeting).toBeCalledWith(mockPg, '1239999')
    expect(mockSendBotMessage).toHaveBeenCalledWith({
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

  it('returns status 500 when error occurred during handling the request', async () => {
    db.getUserActiveMeeting.mockImplementation(() => new Error())
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

    expect(response.statusCode).toBe(500)
  })
})
