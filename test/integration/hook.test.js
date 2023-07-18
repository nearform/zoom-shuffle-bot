import getTestServer from './getTestServer.js'
import {
  EVENT_MEETING_ENDED,
  EVENT_PARTICIPANT_JOINED,
  EVENT_PARTICIPANT_LEFT,
} from '../../const.js'
import resetDatabase from './resetDatabase.js'
import { createVerificationSignature } from '../../helpers/crypto.js'

const server = getTestServer()

describe('/hook route verification', () => {
  it('responds with 401 when not verified', async () => {
    const response = await server.inject({ url: '/hook', method: 'POST' })

    expect(response.statusCode).toBe(401)
  })

  it('responds with 200 when verified', async () => {
    const timestamp = Date.now()
    const payload = {
      payload: {
        object: {},
      },
    }
    const response = await server.inject({
      url: '/hook',
      method: 'POST',
      headers: {
        clientid: process.env.CLIENT_ID,
        'x-zm-request-timestamp': timestamp / 1000,
        'x-zm-signature': createVerificationSignature(timestamp, payload),
      },
      payload,
    })

    expect(response.statusCode).toBe(200)
  })
})

describe('/hook route logic', () => {
  beforeEach(async () => {
    await resetDatabase(server)
  })

  it('adds a meeting participant when a meeting is joined (and the meeting exists)', async () => {
    let meeting = await server.firestore
      .doc('meeting/meetings/test_meeting_id')
      .get()

    expect(meeting.data().users).not.toContain('new-user-id')

    const timestamp = Date.now()
    const payload = {
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
    }
    const response = await server.inject({
      url: '/hook',
      method: 'POST',
      headers: {
        clientid: process.env.CLIENT_ID,
        'x-zm-request-timestamp': timestamp / 1000,
        'x-zm-signature': createVerificationSignature(timestamp, payload),
      },
      payload,
    })

    meeting = await server.firestore
      .doc('meeting/meetings/test_meeting_id')
      .get()

    expect(response.statusCode).toBe(200)
    expect(meeting.data().users).toContain('new-user-id')
    expect(meeting.data().participants).toContain(
      '8a264073297f003d8b022801eaaaffaa'
    )
  })

  it("adds a new meeting when participant joins and the meeting doesn't exist", async () => {
    let meeting = await server.firestore
      .doc('meeting/meetings/test_meeting_id_2')
      .get()

    expect(meeting.exists).toBe(false)

    const timestamp = Date.now()
    const payload = {
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
    }
    const response = await server.inject({
      url: '/hook',
      method: 'POST',
      headers: {
        clientid: process.env.CLIENT_ID,
        'x-zm-request-timestamp': timestamp / 1000,
        'x-zm-signature': createVerificationSignature(timestamp, payload),
      },
      payload,
    })

    meeting = await server.firestore
      .doc('meeting/meetings/test_meeting_id_2')
      .get()

    expect(response.statusCode).toBe(200)
    expect(meeting.data().users).toContain('new-user-id')
    expect(meeting.data().participants).toContain(
      '8a264073297f003d8b022801eaaaffaa'
    )
  })

  it('adds a new meeting when a non-registered user joins first and a registered user follows', async () => {
    let meeting = await server.firestore
      .doc('meeting/meetings/test_meeting_id_2')
      .get()

    expect(meeting.exists).toBe(false)

    const timestamp = Date.now()
    let payload = {
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
    }
    const response = await server.inject({
      url: '/hook',
      method: 'POST',
      headers: {
        clientid: process.env.CLIENT_ID,
        'x-zm-request-timestamp': timestamp / 1000,
        'x-zm-signature': createVerificationSignature(timestamp, payload),
      },
      payload,
    })

    payload = {
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
    }
    await server.inject({
      url: '/hook',
      method: 'POST',
      headers: {
        clientid: process.env.CLIENT_ID,
        'x-zm-request-timestamp': timestamp / 1000,
        'x-zm-signature': createVerificationSignature(timestamp, payload),
      },
      payload,
    })

    meeting = await server.firestore
      .doc('meeting/meetings/test_meeting_id_2')
      .get()

    expect(response.statusCode).toBe(200)
    expect(meeting.data().users).toContain('new-user-id')
    expect(meeting.data().participants).toContain(
      '8a264073297f003d8b022801eaaaffaa'
    )
  })

  it('removes a meeting participant when they leave', async () => {
    let meeting = await server.firestore
      .doc('meeting/meetings/test_meeting_id')
      .get()

    expect(meeting.data().users).toContain('test_user_id')
    expect(meeting.data().participants).toContain(
      '680eda40e80d89c8b3d7fdfe074042e9'
    )

    const timestamp = Date.now()
    const payload = {
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
    }
    const response = await server.inject({
      url: '/hook',
      method: 'POST',
      headers: {
        clientid: process.env.CLIENT_ID,
        'x-zm-request-timestamp': timestamp / 1000,
        'x-zm-signature': createVerificationSignature(timestamp, payload),
      },
      payload,
    })

    meeting = await server.firestore
      .doc('meeting/meetings/test_meeting_id')
      .get()

    expect(response.statusCode).toBe(200)
    expect(meeting.data().users).not.toContain('test_user_id')
    expect(meeting.data().participants).not.toContain(
      '680eda40e80d89c8b3d7fdfe074042e9'
    )
  })

  it('removes a meeting it ends', async () => {
    let meeting = await server.firestore
      .doc('meeting/meetings/test_meeting_id')
      .get()

    expect(meeting.exists).toBe(true)

    const timestamp = Date.now()
    const payload = {
      event: EVENT_MEETING_ENDED,
      payload: {
        object: {
          id: 'test_meeting_id',
          host_id: 'test_host_id',
        },
      },
    }
    const response = await server.inject({
      url: '/hook',
      method: 'POST',
      headers: {
        clientid: process.env.CLIENT_ID,
        'x-zm-request-timestamp': timestamp / 1000,
        'x-zm-signature': createVerificationSignature(timestamp, payload),
      },
      payload,
    })

    meeting = await server.firestore
      .doc('meeting/meetings/test_meeting_id')
      .get()

    expect(response.statusCode).toBe(200)
    expect(meeting.exists).toBe(false)
  })
})
