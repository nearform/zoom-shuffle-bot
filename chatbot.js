import { oauth2, client, setting, log }  from "@zoomus/chatbot";
import moment  from "moment";
import fetch from "node-fetch";
import fastify from "fastify";
import fastifypostgres from "fastify-postgres";

import dotenv from "dotenv";

dotenv.config();
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

const server = fastify({ logger: true });

server.register(fastifypostgres, {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

server.get("/healtcheck", async (req, res) => {
  res.send("OK");
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
      const response = await fetch("https://api.zoom.us/v2/metrics/meetings", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.JWT_TOKEN}`,
        }
      });

      let meetings = await response.json();

      console.log(meetings)

      meetings = meetings.meetings.filter(
        (meeting) => meeting.email === process.env.ENGMNG_EMAIL
      );

      const resMeeting = meetings.map((meeting) => ({
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

      const response = await fetch(`https://api.zoom.us/v2/metrics/meetings/${meetingId}/partecipants`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.JWT_TOKEN}`,
        }
      });
      const partecipants = await response.json();

      console.log(partecipants);

      if(partecipants?.code === 3001){
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
                text: partecipants.message,
              },
            ],
          },
        }); 
        console.log(partecipants);
        return res.code(500).send({})
      }

      const randomPartecipant = partecipants.participants
        .map((p) => p.user_name)
        .sort(() => Math.random() - 0.5)
        .join(", ");
      console.log(randomPartecipant);

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
              text: randomPartecipant,
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
    await server.listen(process.env.PORT, "0.0.0.0");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};
start();
