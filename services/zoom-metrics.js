import fetch from 'node-fetch'
import jwt from 'jsonwebtoken'

function getToken() {
  const payload = {
    iss: process.env.API_KEY,
    exp: Date.now() + 5000,
  }

  return jwt.sign(payload, process.env.API_SECRET)
}

async function fetchEndpoint(endpoint) {
  const response = await fetch(`https://api.zoom.us/v2/metrics${endpoint}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  })

  return response.json()
}

export async function fetchUserMeetings(user_email) {
  const json = await fetchEndpoint('/meetings')

  return json.meetings.filter(meeting => meeting.email === user_email)
}

export async function fetchMeeting(meetingId) {
  return fetchEndpoint(`/meetings/${meetingId}/participants`)
}
