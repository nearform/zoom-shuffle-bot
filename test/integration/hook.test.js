import getTestServer from './getTestServer.js'
import {
  EVENT_MEETING_ENDED,
  EVENT_PARTICIPANT_JOINED,
  EVENT_PARTICIPANT_LEFT,
} from '../../const.js'
import resetDatabase from './resetDatabase.js'

describe('/hook route verification', () => {
  it('responds with 401 when not verified', async () => {
    const server = getTestServer()

    const response = await server.inject({ url: '/hook', method: 'POST' })

    expect(response.statusCode).toBe(401)
  })

  it('responds with 200 when verified', async () => {
    const server = getTestServer()

    const response = await server.inject({
      url: '/hook',
      method: 'POST',
      headers: {
        Authorization: process.env.VERIFICATION_TOKEN,
        clientid: process.env.CLIENT_ID,
      },
      payload: {
        payload: {
          object: {},
        },
      },
    })

    expect(response.statusCode).toBe(200)
  })
})

describe('/hook route logic', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('adds a meeting participant when a meeting is joined (and the meeting exists)', async () => {
    const server = getTestServer()

    await server.ready()

    let meetings = await server.pg.query(
      'SELECT users FROM meetings WHERE id=$1',
      ['test_meeting_id']
    )

    expect(meetings.rows[0].users).not.toContain('new-user-id')

    const response = await server.inject({
      url: '/hook',
      method: 'POST',
      headers: {
        Authorization: process.env.VERIFICATION_TOKEN,
        clientid: process.env.CLIENT_ID,
      },
      payload: {
        event: EVENT_PARTICIPANT_JOINED,
        payload: {
          object: {
            id: 'test_meeting_id',
            host_id: 'test_host_id',
            participant: {
              id: 'new-user-id',
              user_name: 'new user',
            },
          },
        },
      },
    })

    meetings = await server.pg.query(
      'SELECT users, participants FROM meetings WHERE id=$1',
      ['test_meeting_id']
    )

    expect(response.statusCode).toBe(200)
    expect(meetings.rows[0].users).toContain('new-user-id')
    expect(meetings.rows[0].participants).toContain(
      '8a264073297f003d8b022801eaaaffaa'
    )
  })

  it("adds a new meeting when participant joins and the meeting doesn't exist", async () => {
    const server = getTestServer()

    await server.ready()

    let meetings = await server.pg.query(
      'SELECT users FROM meetings WHERE id=$1',
      ['test_meeting_id_2']
    )

    expect(meetings.rows.length).toBe(0)

    const response = await server.inject({
      url: '/hook',
      method: 'POST',
      headers: {
        Authorization: process.env.VERIFICATION_TOKEN,
        clientid: process.env.CLIENT_ID,
      },
      payload: {
        event: EVENT_PARTICIPANT_JOINED,
        payload: {
          object: {
            id: 'test_meeting_id_2',
            host_id: 'test_host_id',
            participant: {
              id: 'new-user-id',
              user_name: 'new user',
            },
          },
        },
      },
    })

    meetings = await server.pg.query(
      'SELECT users, participants FROM meetings WHERE id=$1',
      ['test_meeting_id_2']
    )

    expect(response.statusCode).toBe(200)
    expect(meetings.rows[0].users).toContain('new-user-id')
    expect(meetings.rows[0].participants).toContain(
      '8a264073297f003d8b022801eaaaffaa'
    )
  })

  it('adds a new meeting when a non-registered user joins first and a registered user follows', async () => {
    const server = getTestServer()

    await server.ready()

    let meetings = await server.pg.query(
      'SELECT users FROM meetings WHERE id=$1',
      ['test_meeting_id_2']
    )

    expect(meetings.rows.length).toBe(0)

    const response = await server.inject({
      url: '/hook',
      method: 'POST',
      headers: {
        Authorization: process.env.VERIFICATION_TOKEN,
        clientid: process.env.CLIENT_ID,
      },
      payload: {
        event: EVENT_PARTICIPANT_JOINED,
        payload: {
          object: {
            id: 'test_meeting_id_2',
            host_id: 'test_host_id',
            participant: {
              user_name: 'new user',
            },
          },
        },
      },
    })

    await server.inject({
      url: '/hook',
      method: 'POST',
      headers: {
        Authorization: process.env.VERIFICATION_TOKEN,
        clientid: process.env.CLIENT_ID,
      },
      payload: {
        event: EVENT_PARTICIPANT_JOINED,
        payload: {
          object: {
            id: 'test_meeting_id_2',
            host_id: 'test_host_id',
            participant: {
              id: 'new-user-id',
              user_name: 'new user',
            },
          },
        },
      },
    })

    meetings = await server.pg.query(
      'SELECT users, participants FROM meetings WHERE id=$1',
      ['test_meeting_id_2']
    )

    expect(response.statusCode).toBe(200)
    expect(meetings.rows[0].users).toContain('new-user-id')
    expect(meetings.rows[0].participants).toContain(
      '8a264073297f003d8b022801eaaaffaa'
    )
  })

  it('removes a meeting participant when they leave', async () => {
    const server = getTestServer()

    await server.ready()

    let meetings = await server.pg.query(
      'SELECT users, participants FROM meetings WHERE id=$1',
      ['test_meeting_id']
    )

    expect(meetings.rows[0].users).toContain('test_user_id')
    expect(meetings.rows[0].participants).toContain(
      '680eda40e80d89c8b3d7fdfe074042e9'
    )

    const response = await server.inject({
      url: '/hook',
      method: 'POST',
      headers: {
        Authorization: process.env.VERIFICATION_TOKEN,
        clientid: process.env.CLIENT_ID,
      },
      payload: {
        event: EVENT_PARTICIPANT_LEFT,
        payload: {
          object: {
            id: 'test_meeting_id',
            host_id: 'test_host_id',
            participant: {
              id: 'test_user_id',
              user_name: 'test_user',
            },
          },
        },
      },
    })

    meetings = await server.pg.query(
      'SELECT users, participants FROM meetings WHERE id=$1',
      ['test_meeting_id']
    )

    expect(response.statusCode).toBe(200)
    expect(meetings.rows[0].users).not.toContain('test_user_id')
    expect(meetings.rows[0].participants).not.toContain(
      '680eda40e80d89c8b3d7fdfe074042e9'
    )
  })

  it('removes a meeting it ends', async () => {
    const server = getTestServer()

    await server.ready()

    let meetings = await server.pg.query(
      'SELECT id FROM meetings WHERE id=$1',
      ['test_meeting_id']
    )

    expect(meetings.rows.length).toBe(1)

    const response = await server.inject({
      url: '/hook',
      method: 'POST',
      headers: {
        Authorization: process.env.VERIFICATION_TOKEN,
        clientid: process.env.CLIENT_ID,
      },
      payload: {
        event: EVENT_MEETING_ENDED,
        payload: {
          object: {
            id: 'test_meeting_id',
            host_id: 'test_host_id',
          },
        },
      },
    })

    meetings = await server.pg.query('SELECT id FROM meetings WHERE id=$1', [
      'test_meeting_id',
    ])

    expect(response.statusCode).toBe(200)
    expect(meetings.rows.length).toBe(0)
  })
})
