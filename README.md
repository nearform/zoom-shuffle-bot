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
5. `ngrok http 3000` - to expose your local app running on port 3000 (keep note of your public ngrok https url) 

### Setting up a Zoom Chatbot for development

1. Visit [Zoom Marketplace](https://marketplace.zoom.us/develop/create) and create a new Chatbot in a private account 
   (follow the instructions below and visit [docs](https://marketplace.zoom.us/docs/guides/build/chatbot-app) for 
   reference)
2. In the `App credentials` tab:
   - copy the development `Client ID` and `Client secret` to your local `.env` file
   - fill in the `Redirect URL for OAuth` field - this is the `/authorize` endpoint - 
     in you `.env` file set `REDIRECT_URL` to the same value
   - add your public app url to the `OAuth allow list` - this is necessary for oauth to work
3. In the `Information` tab fill in the `Developer Contact Information` section
4. In the `Feature` tab:
   - fill in the `Bot endpoint URL` field - this is the `/bot` endpoint
   - optionally add a slash command (note: this has to be a value that is unique for the entire Zoom Marketplace)
   - enable `Events subscription` fo all users in the account and subscribe to the following events:
     - End Meeting
     - Participant/Host joined meeting
     - Participant/Host left meeting
   - fill in the `Event notification endpoint URL` - this is the `/hook` endpoint
   - copy the `Verification Token` to your local `.env` file
   - copy the `Bot JID` to your local `.env` file (it will be generated when settings are saved)
5. In the `Scopes` tab add the `user:read:admin` scope - here's a reference description of the used scopes:
   ![Zrzut ekranu 2022-02-2 o 13 25 32](https://user-images.githubusercontent.com/5416572/152153304-6fa14420-0ef5-49c3-9788-9e1de702516e.png)
6. Move on to the `Local test` tab and try installing the app locally (make sure that your app is running, publicly 
   available and using the development secrets). You will be asked to authorize the app and if everything goes well 
   you will be redirected to a new Zoom chat with your bot. You can re-install the app locally as many times as you need.
7. You can test the app by sending any message directly to the bot, or by using the slash command if you've set one up.
