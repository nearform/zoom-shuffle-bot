import { test, describe, beforeEach } from 'node:test'
import getTestServer from './getTestServer.js'
import {
  EVENT_MEETING_ENDED,
  EVENT_PARTICIPANT_JOINED,
  EVENT_PARTICIPANT_LEFT,
} from '../../const.js'
import resetDatabase from './resetDatabase.js'
import { createVerificationSignature } from '../../helpers/crypto.js'

const server = getTestServer()

let timestamp = 0

describe('/hook route verification', () => {
  beforeEach(() => {
    timestamp = Math.floor(Date.now() / 1000)
  })

  test('responds with 401 when not verified', async t => {
    const response = await server.inject({ url: '/hook', method: 'POST' })

    t.assert.strictEqual(response.statusCode, 401)
  })

  test('responds with 200 when verified', async t => {
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
        'x-zm-request-timestamp': timestamp,
        'x-zm-signature': createVerificationSignature(timestamp, payload),
      },
      payload,
    })

    t.assert.strictEqual(response.statusCode, 200)
  })
})

describe('/hook route logic', () => {
  beforeEach(async () => {
    await resetDatabase(server)
    timestamp = Math.floor(Date.now() / 1000)
  })

  test('adds a meeting participant when a meeting is joined (and the meeting exists)', async t => {
    let meeting = await server.firestore
      .doc('meeting/meetings/test_meeting_id')
      .get()

    t.assert.strictEqual(meeting.data().users.includes('new-user-id'), false)

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
        'x-zm-request-timestamp': timestamp,
        'x-zm-signature': createVerificationSignature(timestamp, payload),
      },
      payload,
    })

    meeting = await server.firestore
      .doc('meeting/meetings/test_meeting_id')
      .get()

    t.assert.strictEqual(response.statusCode, 200)
    t.assert.strictEqual(meeting.data().users.includes('new-user-id'), true)
    t.assert.strictEqual(
      meeting.data().participants.includes('8a264073297f003d8b022801eaaaffaa'),
      true,
    )
  })

  test("adds a new meeting when participant joins and the meeting doesn't exist", async t => {
    let meeting = await server.firestore
      .doc('meeting/meetings/test_meeting_id_2')
      .get()

    t.assert.strictEqual(meeting.exists, false)

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
        'x-zm-request-timestamp': timestamp,
        'x-zm-signature': createVerificationSignature(timestamp, payload),
      },
      payload,
    })

    meeting = await server.firestore
      .doc('meeting/meetings/test_meeting_id_2')
      .get()

    t.assert.strictEqual(response.statusCode, 200)
    t.assert.strictEqual(meeting.data().users.includes('new-user-id'), true)
    t.assert.strictEqual(
      meeting.data().participants.includes('8a264073297f003d8b022801eaaaffaa'),
      true,
    )
  })

  test('adds a new meeting when a non-registered user joins first and a registered user follows', async t => {
    let meeting = await server.firestore
      .doc('meeting/meetings/test_meeting_id_2')
      .get()

    t.assert.strictEqual(meeting.exists, false)

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
        'x-zm-request-timestamp': timestamp,
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
        'x-zm-request-timestamp': timestamp,
        'x-zm-signature': createVerificationSignature(timestamp, payload),
      },
      payload,
    })

    meeting = await server.firestore
      .doc('meeting/meetings/test_meeting_id_2')
      .get()

    t.assert.strictEqual(response.statusCode, 200)
    t.assert.strictEqual(meeting.data().users.includes('new-user-id'), true)
    t.assert.strictEqual(
      meeting.data().participants.includes('8a264073297f003d8b022801eaaaffaa'),
      true,
    )
  })

  test('removes a meeting participant when they leave', async t => {
    let meeting = await server.firestore
      .doc('meeting/meetings/test_meeting_id')
      .get()

    t.assert.strictEqual(meeting.data().users.includes('test_user_id'), true)
    t.assert.strictEqual(
      meeting.data().participants.includes('680eda40e80d89c8b3d7fdfe074042e9'),
      true,
    )

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
        'x-zm-request-timestamp': timestamp,
        'x-zm-signature': createVerificationSignature(timestamp, payload),
      },
      payload,
    })

    meeting = await server.firestore
      .doc('meeting/meetings/test_meeting_id')
      .get()

    t.assert.strictEqual(response.statusCode, 200)
    t.assert.strictEqual(meeting.data().users.includes('test_user_id'), false)
    t.assert.strictEqual(
      meeting.data().participants.includes('680eda40e80d89c8b3d7fdfe074042e9'),
      false,
    )
  })

  test('removes a meeting it ends', async t => {
    let meeting = await server.firestore
      .doc('meeting/meetings/test_meeting_id')
      .get()

    t.assert.strictEqual(meeting.exists, true)

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
        'x-zm-request-timestamp': timestamp,
        'x-zm-signature': createVerificationSignature(timestamp, payload),
      },
      payload,
    })

    meeting = await server.firestore
      .doc('meeting/meetings/test_meeting_id')
      .get()

    t.assert.strictEqual(response.statusCode, 200)
    t.assert.strictEqual(meeting.exists, false)
  })
})
