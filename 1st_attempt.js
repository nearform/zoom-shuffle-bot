// THIS FILE CONTAINS THE CODE FOR THE CREATE
// A ZOOM OAUTH APPLICATION
// IT REQUIRES TO ENABLE ESM IN PACKAGE.JSON

import fetch from "node-fetch";
import fastify from "fastify";
import dotenv from "dotenv";
// import pov from "point-of-view";
// import ejs from "ejs";

dotenv.config();

const server = fastify({ logger: true });
const store = {};

server.register(pov, {
  engine: {
    ejs
  }
})


server.get("/", async (request, reply) => {
  const token = request.query.token;
  fetch("https://api.zoom.us/v2/users/me", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => res.json())
    .then((data) => reply.send(data))
    .catch((data) => reply.send(data));
});

server.get("/meetings", async (request, reply) => {
  const token = request.query.token;
  try {
    let data = await fetch("https://api.zoom.us/v2/users/me/meetings", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    data = await data.json();

    reply.send(data);
    reply.view("/templates/meetings.ejs", { meetings: data.meetings });
  } catch (e) {
    return reply.code(501).send(e);
  }
});

server.get("/meetings/v2", async (request, reply) => {
  const token = request.query.token;
  fetch("https://api.zoom.us/v2/metrics/meetings", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    query: {
      type: "live",
    },
  })
    .then((res) => res.json())
    .then((data) => {
      const meetings = data.meetings;
      const meetingFiltered = meetings.filter(
        (meeting) => meeting.email === process.env.ENGMNG_EMAIL
      );
      reply.send(meetingFiltered);
    })
    .catch((data) => "error");
});

server.get("/meetings/:meeting/attendees", {
  schema: {
    params: {
      meeting: { type: "number" },
    },
  },
  handler: async (request, reply) => {
    const token = request.query.token;
    const meeting = request.params.meeting;
    fetch(`https://api.zoom.us/v2/metrics/meetings/${meeting}/participants`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const attendees = data.participants.filter(
          (attender) => attender?.leave_type === undefined
        );
        reply.send(data);
      })
      .catch((data) => "errpr");
  },
});

server.get("/auth", async (request, reply) => {
  reply.redirect(
    `https://zoom.us/oauth/authorize?client_id=${process.env.CLIENT_ID}&response_type=code&redirect_uri=${process.env.REDIRECT_URI}`
  );
});

server.get("/auth/callback", async (request, reply) => {
  const code = request.query.code;

  if (!code) {
    return reply.code(501).send(new Error("no code received"));
  }

  try {
    const res = await fetch("https://zoom.us/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        code: code,
        grant_type: "authorization_code",
        redirect_uri: process.env.REDIRECT_URI,
      }),
    });

    const data = await res.json();

    console.log(data);
    if (data.access_token) {
      return reply.send(data.access_token);
    } else {
      return reply.code(501).send(new Error("no code received"));
    }
  } catch (e) {
    return reply.code(501).send(e);
  }
});

// Run the server!
const start = async () => {
  try {
    await server.listen(3000);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};
start();
