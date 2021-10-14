const { oauth2, client, setting, log } = require("@zoomus/chatbot");
const moment = require("moment");
require("dotenv").config();
const oauth2Client = oauth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);
let chatbot = client(
  process.env.CLIENT_ID,
  process.env.VERIFICATION_TOKEN,
  process.env.ROBOT_JID
).defaultAuth(oauth2Client.connect());

const server = require("fastify")({ logger: true });

server.register(require("fastify-postgres"), {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

server.get("/auth/bot-callback", async (req, res) => {
  try {
    let { code } = req.query;

    let connection = await oauth2Client.connectByCode(code);
    let zoomApp = chatbot.create({ auth: connection });
    let tokens = zoomApp.auth.getTokens();
    let me = await zoomApp.request({ url: "/v2/users/me", method: "get" });

    await upsertTokens(me.id, tokens);

    res.redirect(
      `https://zoom.us/launch/chat?jid=robot_${process.env.ROBOT_JID}`
    );
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

server.post("/bot", async function (req, res) {
  console.log("ping");
  try {
    let data = await chatbot.handle({ body: req.body, headers: req.headers });
    let { event, command, type, payload } = data;
    let { toJid, userJid, accountId, userId, actionItem } = payload;

    let zoomApp = chatbot.create();

    let tokens = await getTokens(userId);

    if (tokens.rows.length === 0) {
      throw new Error("User not found");
    }

    tokens = tokens.rows[0];

    await zoomApp.auth.setTokens(
      tokens.access_token,
      tokens.refresh_token,
      tokens.expires_date
    );

    // Verify if token is expired
    try {
      await zoomApp.request({ url: "/v2/users/me", method: "get" });
    } catch (e) {
      console.log("REFRESH TOKEN");
      let newTokens = await zoomApp.auth.requestTokensByRefresh(
        tokens.refresh_token
      );
      await upsertTokens(userId, newTokens);
      await zoomApp.auth.setTokens(
        newTokens.access_token,
        newTokens.refresh_token,
        newTokens.expires_date
      );
    }

    if (command === "meetings") {
      const meetings = await zoomApp.request({
        url: `/v2/users/${userId}/meetings`,
        method: "get",
      });

      const resMeeting = meetings.meetings.map((meeting) => ({
        text: meeting.topic,
        value: `meeting/${meeting.id}`,
      }));

      await zoomApp.sendMessage({
        user_jid: userJid, //which user can see this message
        to_jid: toJid,
        account_id: accountId,
        content: {
          head: {
            text: "Meetings",
            sub_head: {
              text: "select one meeting to see info",
            },
          },
          body: [
            {
              type: "actions",
              items: resMeeting,
            },
          ],
        },
      });
    }

    if (actionItem && actionItem.value.startsWith("meeting/")) {
      const meetingId = actionItem.value.split("/")[1];
      const meeting = await zoomApp.request({
        url: `/v2/meetings/${meetingId}`,
        method: "get",
      });

      await zoomApp.sendMessage({
        user_jid: userJid,
        to_jid: toJid,
        account_id: accountId,
        content: {
          head: {
            text: "Meeting details",
          },
          body: [
            {
              type: "message",
              text: meeting.start_url,
            },
          ],
        },
      });

      // const partecipants = await zoomApp.request({
      //   url: `/v2/past_meetings/${meeting.uuid}`,
      //   method: "get",
      //   // headers: { "content-type": "application/json" },
      // });

      const partecipants = await zoomApp.request({
        url: `https://api.zoom.us/v2/metrics/meetings/${meetingId}/participants`,
        method: "get",
      });

      await zoomApp.sendMessage({
        user_jid: userJid,
        to_jid: toJid,
        account_id: accountId,
        content: {
          head: {
            text: "Meeting partecipants",
          },
          body: [
            {
              type: "message",
              text: partecipants.partecipants.map((partecipant) => partecipant.username).sort(() => (Math.random() > .5) ? 1 : -1).join(", "),
            },
          ],
        },
      });

    }

    res.code(200).send({});
  } catch (e) {
    console.log(e);
    res.code(500).send({});
  }
});

async function getTokens(userId) {
  const dbClient = await server.pg.connect();

  const query = {
    text: "SELECT * FROM tokens WHERE user_id = $1",
    values: [userId],
  };

  const res = await dbClient.query(query);
  dbClient.release();
  return res;
}

async function upsertTokens(userId, tokens) {
  const dbClient = await server.pg.connect();

  const query = {
    text: "INSERT INTO tokens(user_id, access_token, refresh_token, expires_date) VALUES($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE set access_token = $2, refresh_token = $3, expires_date = $4 ",
    values: [
      userId,
      tokens.access_token,
      tokens.refresh_token,
      moment().add(tokens.expires_in, "seconds").format(),
    ],
  };

  await dbClient.query(query);
  dbClient.release();
}

const start = async () => {
  try {
    await server.listen(3000);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};
start();
