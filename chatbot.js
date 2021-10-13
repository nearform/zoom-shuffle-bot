const { oauth2, client, setting, log } = require("@zoomus/chatbot");
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
const db = {};

server.get("/auth/bot-callback", async (req, res) => {
  let { code } = req.query;
  try {
    let connection = await oauth2Client.connectByCode(code);
    let zoomApp = chatbot.create({ auth: connection }); //this is the first store tokens,zoomApp have already inject tokens by connection.you can use zoomApp to request zoom openapi
    let tokens = zoomApp.auth.getTokens();
    console.log(tokens);
    let me = await zoomApp.request({ url: "/v2/users/me", method: "get" });
    console.log(me);
    db[me.id] = tokens;
    console.log(db);
    res.redirect(
      `https://zoom.us/launch/chat?jid=robot_${process.env.ROBOT_JID}`
    );
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

server.post("/bot", async function (req, res) {
  try {
    let data = await chatbot.handle({ body: req.body, headers: req.headers });
    let { event, command, type, payload } = data;
    let { toJid, userJid, accountId, userId, actionItem } = payload;
    let zoomApp = chatbot.create();

    zoomApp.auth.setTokens({
      access_token: db[userId].access_token,
      refresh_token: db[userId].refresh_token,
      expires_date: db[userId].expires_date,
    });



    if(command === "meetings") {
      const meetings = await zoomApp.request({
        url: `/v2/users/${userId}/meetings`,
        method: "get",
        headers: { "content-type": "application/json" },
      });
  
      const resMeeting = meetings.meetings.map(meeting => ({
        text: meeting.topic,
        value: `meeting/${meeting.id}`,
      }))
      
      await zoomApp.sendMessage({
        user_jid: userJid, //which user can see this message
        to_jid: toJid,
        account_id: accountId,
        option: { "Content-Type": "application/json" },
        content: {
          "head": {
            "text": "Meetings",
            "sub_head": {
              "text": "select one meeting to see info"
            }
          },
          body: [
            {
              type: "actions",
              items: resMeeting
            },
          ],
        },
      });
    }

    if( actionItem && actionItem.value.startsWith("meeting/") ) {
      const meetingId = actionItem.value.split("/")[1]
      const meeting = await zoomApp.request({
        url: `/v2/meetings/${meetingId}`,
        method: "get",
        headers: { "content-type": "application/json" },
      });
      console.log(meeting)
   
      await zoomApp.sendMessage({
        user_jid: userJid, //which user can see this message
        to_jid: toJid,
        account_id: accountId,
        option: { "Content-Type": "application/json" },
        content: {
          "head": {
            "text": "Meeting details",
          },
          body: [
            {
              type: "message",
              text: meeting.start_url
            },
          ],
        },
      });

      const partecipants = await zoomApp.request({
        url: `/v2/past_meetings/${meeting.uuid}`,
        method: "get",
        headers: { "content-type": "application/json" },
      }); 

      console.log(partecipants)
    }

    

    res.code(200).send({});
  } catch (e) {
    console.log(e);
  }
});


const start = async () => {
  try {
    await server.listen(3000);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};
start();
