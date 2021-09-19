# telegram-bot

## Run locally;
`npm run-script develop` to start TypeScript compiler in watch mode.
`npm run-script serve` to start Firebase Emulators.
`ngrok http 7001` to setup a tunnel to local firebase emulator.

Set TG webhook URL e.g.;
`curl -F "url=https://<NGROK-URL>.ngrok.io/stargazer-c5667/us-central1/handleUpdate" https://api.telegram.org/bot1862359777:<TOKEN>/setWebhook`

## Sync Firebase Config
`firebase functions:config:get > .runtimeconfig.json`

## Set new Firebase Configs;
`firebase functions:config:set telegram.bot_token="1862359777:<TOKEN>"`
