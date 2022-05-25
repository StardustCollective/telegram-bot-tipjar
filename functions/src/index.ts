import * as fb from "firebase-admin";
import * as functions from "firebase-functions";
import {config} from "firebase-functions";
import {Database} from "./database";
import {Webhook} from "./webhook";
import {Language} from "./language";

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

      // When the bot gets added to a group it can get stuck without this.
      if (req.body.message && !req.body.message.text) {
        console.log("No text, return");
        return res.status(200).send();
      }

      if (!req.body.message && !req.body.callback_query) {
        return res.status(200).send();
      }

      try {
        // Handle callback queries, these come from inline commands.
        if (req.body.callback_query) {
          try {
            const groupLanguage = await Database.getInstance()
                .getGroupLanguage(req.body.callback_query.message.chat.id);
            await webhook.handleCallbackQuery(
                req.body.callback_query.from.id,
                req.body.callback_query.message.chat.id,
                req.body.callback_query.message.message_id,
                req.body.callback_query.data,
                req.body.callback_query.from.language_code,
                groupLanguage
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
        const tgUserLanguage = req.body.message.from.language_code;
        const chatType = req.body.message.chat?.type;

        const groupLanguage = await Database.getInstance()
            .getGroupLanguage(chatId);

        console.log("chatID: ", chatId);

        const {
          translatedBalance,
          translatedHelp,
          translatedDeposit,
          translatedWithdraw,
        } = Language.getKeyboardStrings(chatType === "supergroup" ?
            groupLanguage : tgUserLanguage);
        if (messageText) {
          // The commands are sent by 'text',
          // so parse them and start the chosen flow.
          const command = messageText.split("@");
          switch (command[0]) {
            case "/start":
              await webhook.handleStart(tgUserId, tgUsername, tgUserLanguage);
              break;
            case "/balance":
            case translatedBalance:
              await webhook.handleBalance(tgUserId, tgUserLanguage); break;
            case "/deposit":
            case translatedDeposit:
              await webhook.handleDeposit(tgUserId, tgUserLanguage); break;
            case "/withdraw":
            case translatedWithdraw:
              await webhook.handleWithdrawal(tgUserId, tgUserLanguage); break;
            case "/help":
            case translatedHelp:
              await webhook.handleHelp(tgUserId, tgUserLanguage); break;
            case "/disclaimer":
              await webhook.handleDisclaimer(tgUserId, tgUserLanguage); break;
            default:
              await webhook.handleDefault(
                  tgUserId,
                  command[0],
                  messageText,
                  chatId,
                  tgUserLanguage,
                  groupLanguage);
              break;
          }
        }

        return res.status(200).send();
      } catch (ex) {
        console.error(ex);
        return res.status(500).send();
      }
    });
