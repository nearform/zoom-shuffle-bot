import { getBotTokenData, getUserActiveMeeting } from './db.js'

describe('getBotTokenData()', () => {
  it('returns the first row if found', async () => {
    const client = { query: jest.fn() }
    client.query.mockResolvedValueOnce({ rows: ['test token', 'test token 2'] })

    expect(client.query).not.toHaveBeenCalled()

    const token = await getBotTokenData(client)

    expect(client.query).toHaveBeenCalledTimes(1)
    expect(token).toBe('test token')
  })

  it('returns undefined if nothing is found in db', async () => {
    const client = { query: jest.fn() }
    client.query.mockResolvedValueOnce({ rows: [] })

    expect(client.query).not.toHaveBeenCalled()

    const token = await getBotTokenData(client)

    expect(client.query).toHaveBeenCalledTimes(1)
    expect(token).toBe(undefined)
  })
})

describe('getUserActiveMeeting()', () => {
  it('returns the first row if found', async () => {
    const client = { query: jest.fn() }
    client.query.mockResolvedValueOnce({
      rows: ['test meeting', 'test meeting 2'],
    })

    expect(client.query).not.toHaveBeenCalled()

    const meeting = await getUserActiveMeeting(client)

    expect(client.query).toHaveBeenCalledTimes(1)
    expect(meeting).toBe('test meeting')
  })

  it('returns undefined if nothing is found in db', async () => {
    const client = { query: jest.fn() }
    client.query.mockResolvedValueOnce({ rows: [] })

    expect(client.query).not.toHaveBeenCalled()

    const meeting = await getUserActiveMeeting(client)

    expect(client.query).toHaveBeenCalledTimes(1)
    expect(meeting).toBe(undefined)
  })
})
