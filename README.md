# Zoom Shuffle Bot

This repo contains a Zoom Chatbot used to retrieve a randomized list of your current meeting's participants:

![Nagranie z ekranu 2022-02-2 o 12 12 17](https://user-images.githubusercontent.com/5416572/152143409-12162c5f-210e-40a3-bf1b-aa0362612089.gif)

The bot will work for any logged-in meeting participant.

## Architecture

The app is an HTTP server (using Fastify) backed by a Postgres database for persisting data.

The server has three public endpoints:

- `/authorize` - called when the app is installed in a Zoom account, here we fetch an initial oauth token for accessing
  Zoom's API
- `/hook` - used for handling event subscriptions (participant joined, participant left, meeting ended) and stores the 
  state of active meetings in the database - when a meeting ends it's removed
- `/bot` - used for handling Chatbot calls (when a slash command is used or a direct message is sent to the bot), and
  responds with the randomized list of participants

Meeting participants might not necessarily be logged in, that's why the app is storing both the usernames (which may be 
set for the current meeting only) and user ids of the logged-in users for looking up their active meetings.

To avoid privacy issues usernames stored in the database are encrypted using SHA256.

## Continuous Integration and Delivery

GitHub Actions are used for running tests in a controlled environment, as well as deploying the `master` branch to 
Google Cloud Platform.

The Continuous Delivery workflow can be triggered manually in the `Actions` tab (the test database and Run instance have 
to be removed manually).

## Monitoring and logs

Application metrics can be monitored in the [Cloud Run service details page](https://console.cloud.google.com/run/detail/europe-west1/zoom-shuffle-bot/metrics?project=shuffle-zoom-bot).

The app utilizes Fastify's default logger, and the production logs are easily accessible using [GCP's Logs Explorer](https://console.cloud.google.com/logs/query;query=resource.type%3D%22cloud_run_revision%22%0Aresource.labels.service_name%3D%22zoom-shuffle-bot%22?project=shuffle-zoom-bot). 
Logs can be easily narrowed down to a specific commit deployment by filtering on revision names which consist of 
`${SERVICE_NAME}-${COMMIT_SHA}`.

## Local development

### Requirements

- Node LTS
- npm >=8
- docker
- docker-compose

### Setting up the local environment

1. `cp .env.sample .env` - the missing environment variables will come from the Zoom Chatbot setup 👇
2. `npm run db:up` - to start up the database docker container
3. `npm run db:migrate` - to initialize the database tables
4. `npm run dev` - to start up the local server with nodemon (node debugger is available on the default port 9229)
5. `ngrok http 3000` - to expose your local app running on port 3000

Keep note of your public ngrok https url - we'll refer to it as `$PUBLIC_URL` in the following steps:
![Zrzut ekranu 2022-02-3 o 17 04 51](https://user-images.githubusercontent.com/5416572/152380581-d9bd7eba-81d3-454a-80eb-d33354daa8d2.png)

NOTE: If you're using ngrok to expose your local app make sure to create an account and log in before proceeding with 
the following steps.

### Setting up a Zoom Chatbot for development

1. Visit [Zoom Marketplace](https://marketplace.zoom.us/develop/create) and create a new Chatbot in a private account 
   (follow the instructions below and visit [docs](https://marketplace.zoom.us/docs/guides/build/chatbot-app) for 
   reference)
2. In the `App credentials` tab:
   - copy the development `Client ID` and `Client secret` to your local `.env` file
   - fill in the `Redirect URL for OAuth` field - this is the `$PUBLIC_URL/authorize` endpoint - 
     in you `.env` file set `REDIRECT_URL` to the same value
   - add the `$PUBLIC_URL` to the `OAuth allow list` - this is necessary for oauth to work
   ![Zrzut ekranu 2022-02-3 o 17 10 46](https://user-images.githubusercontent.com/5416572/152381611-ff55fbc4-79b4-426d-a227-8ebb79002461.png)
3. In the `Information` tab fill in the `Developer Contact Information` section
4. In the `Feature` tab:
   - fill in the `Bot endpoint URL` field - this is the `$PUBLIC_URL/bot` endpoint
   - optionally add a slash command (note: this has to be a value that is unique for the entire Zoom Marketplace)
   - enable `Events subscription` fo all users in the account and subscribe to the following events:
     - End Meeting
     - Participant/Host joined meeting
     - Participant/Host left meeting
   - fill in the `Event notification endpoint URL` - this is the `$PUBLIC_URL/hook` endpoint
   - copy the `Verification Token` to your local `.env` file
   - copy the `Bot JID` to your local `.env` file (it will be generated when settings are saved)
   ![Zrzut ekranu 2022-02-3 o 17 12 53](https://user-images.githubusercontent.com/5416572/152381946-e7cbc48b-849e-4b44-b698-05a5020ad85e.png)
5. In the `Scopes` tab add the `user:read:admin` scope - here's a reference description of the used scopes:
   ![Zrzut ekranu 2022-02-2 o 13 25 32](https://user-images.githubusercontent.com/5416572/152153304-6fa14420-0ef5-49c3-9788-9e1de702516e.png)
6. Move on to the `Local test` tab and try installing the app locally (make sure that your app is running, publicly 
   available and using the development secrets). You will be asked to authorize the app and if everything goes well 
   you will be redirected to a new Zoom chat with your bot. You can re-install the app locally as many times as you need.
7. You can test the app by sending any message directly to the bot, or by using the slash command if you've set one up.

## Troubleshooting

During the setup and installation phase you can come across a few problems:

### Gmail issue:
Since February 2022 are occurring some problems creating the bot using an account registered with the @gmail.com domain. The returned error is a generic `fail_register_robot_to_robot_service`. Using an account made using a non-Gmail account everything works well. https://devforum.zoom.us/t/getting-fail-register-robot-to-robot-service-error-while-saving-bot-url-in-features/64742

### Linux issue:
Another little problem comes when the app is locally tested using Linux. 
Authorizing the device redirect you to an unsupported page, and the bot is not added to your account.
In this case, try using windows or mac.

### Webhooks issue:
If the bot stop working and always respond "Sorry, you don't seem to be participating in any of the ongoing meetings", it can depend on a problem with the webhooks, in
fact, the tracking of the join and left of the meeting is tracked using the webhooks.

For the local testing is enough to re-authorize the bot by clicking on the Add button in the Local test tab and trying again.

![Bot_screenshot_20220308_160418](https://user-images.githubusercontent.com/1851362/157255589-1894ceda-c89d-4a14-badf-45f8b5524b18.png)

For the production environment, you can try to open the `publishable url` in a browser. The publishable url is available in the submit tab of the app configuration.

![Bot_screenshot_20220308_160419](https://user-images.githubusercontent.com/1851362/157255632-1f263236-7f0b-4b55-9e56-231132f3764d.png)
