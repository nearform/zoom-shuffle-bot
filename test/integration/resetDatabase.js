export default async function resetDatabase(server) {
  await server.ready()

  await server.firestore.doc('token/api/test_account_id').delete()
  await server.firestore.doc('token/api/test_account_id').set({
    accessToken: 'test_api_access_token',
    refreshToken: 'test_refresh_token',
    expiresOn: 9999999999,
  })

  await server.firestore.doc('meeting/meetings/test_meeting_id').delete()
  await server.firestore.doc('meeting/meetings/test_meeting_id_2').delete()
  await server.firestore.doc('meeting/meetings/test_meeting_id').set({
    hostId: 'test_host_id',
    users: ['test_user_id'],
    participants: ['680eda40e80d89c8b3d7fdfe074042e9'],
    dateAdded: new Date(),
  })
}
