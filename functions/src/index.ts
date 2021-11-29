import * as fb from "firebase-admin";
import * as functions from "firebase-functions";
import {config} from "firebase-functions";
import {Database} from "./database";
import {Webhook} from "./webhook";

// Setup DB for triggers.
Database.getInstance();

const webhook = new Webhook();

// Get TG Webhook API key from ENV.
const WEBHOOK_API_KEY = config().env.webhook_api_key;

// Ensure user_id / username combination is always updated in `usernames` table,
// when usernames change for TG userIDs.
exports.dbUsernameTrigger = functions.database.ref("/users/{user_id}/username")
    .onWrite(async (change, context) => {
      await fb.database().ref(`usernames/@${change.before.val()}`).remove();
      await fb.database().ref(`usernames/@${change.after.val()}`).update(
          {id: context.params.user_id}
      );
    });

// HTTP Handler for Telegram webhook.
// @deprecated, remove when migration is complete.
exports.handleUpdate = functions
    .runWith({
      minInstances: 2,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .https.onRequest(async (req, res): Promise<any> => {
      console.log("handleUpdate req.body: ", JSON.stringify(req.body));

      if (!req.body.message && !req.body.callback_query) {
        return res.status(200).send();
      }

      try {
        // Handle callback queries, these come from inline commands.
        if (req.body.callback_query) {
          try {
            await webhook.handleCallbackQuery(
                req.body.callback_query.from.id,
                req.body.callback_query.message.chat.id,
                req.body.callback_query.message.message_id,
                req.body.callback_query.data
            );
            return res.status(200).send();
          } catch (ex) {
            console.error(ex);
            // TODO: after test re-enable to force TG API to retry.
            // return res.status(500).send(ex.message);
            return res.status(200).send();
          }
        }

        console.log("message.chat: ", JSON.stringify(req.body.message.chat));

        const tgUserId = req.body.message.from.id;
        const tgUsername = req.body.message.from.username;
        const messageText = req.body.message.text;
        const chatId = req.body.message.chat?.id;

        console.log("chatID: ", chatId);

        // The commands are sent by 'text',
        // so parse them and start the chosen flow.
        switch (req.body.message.text) {
          case "/start":
            await webhook.handleStart(tgUserId, tgUsername); break;
          case "/balance":
          case "👛 Balance":
            await webhook.handleBalance(tgUserId); break;
          case "/deposit":
          case "💰 Deposit":
            await webhook.handleDeposit(tgUserId); break;
          case "/withdraw":
          case "💸 Withdraw":
            await webhook.handleWithdrawal(tgUserId); break;
          case "/help":
          case "🆘 Help":
            await webhook.handleHelp(tgUserId); break;
          case "/disclaimer":
            await webhook.handleDisclaimer(tgUserId); break;
          default:
            await webhook.handleDefault(tgUserId, messageText, chatId); break;
        }

        return res.status(200).send();
      } catch (ex) {
        console.error(ex);
        // TODO: after test re-enable to force TG API to retry.
        // return res.status(500).send(ex.message);
        return res.status(200).send();
      }
    });

// HTTP Handler for Telegram webhook.
exports.telegram = functions
    .runWith({
      minInstances: 2,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .https.onRequest(async (req, res): Promise<any> => {
      if (config().env.production && req.path.slice(1) !== WEBHOOK_API_KEY) {
        return res.status(403).send();
      }

      console.log("telegram webhook req.body: ", JSON.stringify(req.body));

      if (!req.body.message && !req.body.callback_query) {
        return res.status(200).send();
      }

      try {
        // Handle callback queries, these come from inline commands.
        if (req.body.callback_query) {
          try {
            await webhook.handleCallbackQuery(
                req.body.callback_query.from.id,
                req.body.callback_query.message.chat.id,
                req.body.callback_query.message.message_id,
                req.body.callback_query.data
            );
            return res.status(200).send();
          } catch (ex) {
            console.error(ex);
            return res.status(500).send();
          }
        }

        console.log("message.chat: ", JSON.stringify(req.body.message.chat));

        const tgUserId = req.body.message.from.id;
        const tgUsername = req.body.message.from.username;
        const messageText = req.body.message.text;
        const chatId = req.body.message.chat?.id;

        console.log("chatID: ", chatId);

        // The commands are sent by 'text',
        // so parse them and start the chosen flow.
        switch (req.body.message.text) {
          case "/start":
            await webhook.handleStart(tgUserId, tgUsername); break;
          case "/balance":
          case "👛 Balance":
            await webhook.handleBalance(tgUserId); break;
          case "/deposit":
          case "💰 Deposit":
            await webhook.handleDeposit(tgUserId); break;
          case "/withdraw":
          case "💸 Withdraw":
            await webhook.handleWithdrawal(tgUserId); break;
          case "/help":
          case "🆘 Help":
            await webhook.handleHelp(tgUserId); break;
          case "/disclaimer":
            await webhook.handleDisclaimer(tgUserId); break;
          default:
            await webhook.handleDefault(tgUserId, messageText, chatId); break;
        }

        return res.status(200).send();
      } catch (ex) {
        console.error(ex);
        return res.status(500).send();
      }
    });
