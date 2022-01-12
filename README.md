# Nearform talking stick

This repo contains a Zoom Chatbot that can be used to retrieve a talk order for the bench standups.

## Local development

### Prerequisites

### Setting up a Zoom Chatbot

1. Visit https://marketplace.zoom.us/develop/create and create a new Chatbot (follow the instructions below and visit 
   [docs](https://marketplace.zoom.us/docs/guides/build/chatbot-app) for reference)
2. In the `App credentials` tab:
   - copy the `Client ID` and `Client secret` to your local `.env` file (the development credentials will be used for local testing)
   - fill in the `Redirect URL for OAuth` field - this is the `/auth/bot-callback` endpoint (keep in mind that your app 
     has to be publicly accessible - tunneling services such as `ngrok` might come in handy) - set the `REDIRECT_URI` env var to the same value
   - add the development and production domains to the `OAuth allow list` - this is necessary for the redirect to work
3. In the `Information` tab fill in the `Developer Contact Information` section
4. In the `Feature` tab:
   - fill in the `Bot endpoint URL` field - this is the `/bot` endpoint
   - optionally add a slash command
   - copy the `Verification Token` to your local `.env` file
   - copy the `Bot JID` to your local `.env` file (it will be generated when settings are saved)
5. In the `Scopes` tab add the `user:read:admin` scope - this is required for accessing current user's data (name, email, ...)
6. Move on to the `Local test` tab and try installing the app locally (make sure that your app is running, publicly 
   available and using the development secrets). You will be asked to authorize the app and if everything goes well 
   you will be redirected to a new Zoom chat with your bot. You can re-install the app locally as many times as you need.
7. Test the commands and actions handled within the `/bot` route. A `command` is either a slash command defined for the 
   bot or any message sent in the individual chat with the bot (see [docs](https://marketplace.zoom.us/docs/guides/chatbots/slash-commands-and-ui-elements#slash-commands)). 
   An `action` however occurs when a user interacts with a message sent by your bot (see [docs](https://marketplace.zoom.us/docs/guides/chatbots/slash-commands-and-ui-elements#ui-elements)).
