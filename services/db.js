import { FieldValue } from '@google-cloud/firestore'

export async function getBotTokenData(collection, accountId) {
  const doc = await collection.doc(`token/bot/${accountId}`).get()

  if (!doc.exists) {
    return undefined
  } else {
    return doc.data()
  }
}

export async function upsertBotTokenData(
  collection,
  accountId,
  accessToken,
  expiresOn
) {
  const docRef = await collection.doc(`token/bot/${accountId}`)

  return docRef.set(
    {
      accessToken,
      expiresOn,
    },
    { merge: true }
  )
}

export async function getApiTokenData(collection, accountId) {
  const doc = await collection.doc(`token/api/${accountId}`).get()

  if (!doc.exists) {
    return undefined
  } else {
    return doc.data()
  }
}

export async function upsertApiTokenData(
  collection,
  accountId,
  accessToken,
  refreshToken,
  expiresOn
) {
  const docRef = await collection.doc(`token/api/${accountId}`)

  return docRef.set(
    {
      accessToken,
      refreshToken,
      expiresOn,
    },
    { merge: true }
  )
}

export async function addParticipant(
  collection,
  meetingId,
  hostId,
  userId,
  participantName
) {
  const docRef = collection.doc(`meeting/meetings/${meetingId}`)
  const doc = await docRef.get()

  if (doc.exists) {
    const updateData = {
      participants: FieldValue.arrayUnion(participantName),
    }

    if (userId) {
      updateData.users = FieldValue.arrayUnion(userId)
    }

    return docRef.update(updateData)
  } else {
    return docRef.set({
      hostId,
      users: userId ? [userId] : [],
      participants: [participantName],
      dateAdded: new Date(),
    })
  }
}

export async function removeParticipant(
  collection,
  meetingId,
  userId,
  participantName
) {
  const docRef = collection.doc(`meeting/meetings/${meetingId}`)
  const doc = await docRef.get()

  if (!doc.exists) {
    return
  }

  const updateData = {
    participants: FieldValue.arrayRemove(participantName),
  }

  if (userId) {
    updateData.users = FieldValue.arrayRemove(userId)
  }

  return docRef.update(updateData)
}

export async function removeMeeting(collection, meetingId) {
  return collection.doc(`meeting/meetings/${meetingId}`).delete()
}

export async function getUserActiveMeeting(collection, userId) {
  if (!userId) {
    return undefined
  }

  const snapshot = await collection
    .doc('meeting')
    .collection('meetings')
    .where('users', 'array-contains', userId)
    .orderBy('dateAdded')
    .limit(1)
    .get()

  if (snapshot.empty) {
    return undefined
  } else {
    const doc = snapshot.docs[0]
    return { id: doc.id, ...doc.data() }
  }
}
