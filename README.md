# telegram-bot

## Run locally;
Inside functions folder;
`yarn develop` or `npm run-script develop` to start TypeScript compiler in watch mode.
`yarn serve` or `npm run-script serve` to start Firebase Emulators.
`ngrok http 7001` to setup a tunnel to local firebase emulator.

Set TG webhook URL e.g.;
- `curl -F "url=https://<NGROK-URL>.ngrok.io/<firebase-url>/telegram/RANDOM-API-KEY" https://api.telegram.org/bot<botID>:<TOKEN>/setWebhook`

The `RANDOM-API-KEY` is an API key that you choose yourself and set on the Firebase Config (see below).

## Sync Firebase Config
Inside functions folder;
- `firebase functions:config:get > .runtimeconfig.json`

## Set new Firebase Configs examples;
- `firebase functions:config:set telegram.bot_token="<botID>:<TOKEN>"`
- `firebase functions:config:set env.production=true`
- `firebase functions:config:set env.database_url="https://<FB_RTDB_URL>.rtdb.firebaseio.com/"`
- `firebase functions:config:set env.webhook_api_key="RANDOM-API-KEY"`
- `firebase functions:config:set dag_network.id="ceres"`
- `firebase functions:config:set dag_network.be_url="https://api-be.exchanges.constellationnetwork.io"`
- `firebase functions:config:set dag_network.lb_url="http://lb.exchanges.constellationnetwork.io:9000"`

## Deploying new version;
Just run `firebase deploy` inside this folder, you'll need to have Firebase setup for this.

## Change Telegram Bot;
- Run `firebase functions:config:set telegram.bot_token="<botID>:<TOKEN>"`
- And of course set the Webhook URL for that bot;
- `curl -F "url=https://<FB_PROJECT>.cloudfunctions.net/telegram/RANDOM-API-KEY" https://api.telegram.org/<botID>:<TOKEN>/setWebhook`
