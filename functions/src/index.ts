import {https} from "firebase-functions";
import {Webhook} from "./webhook";

// TODO: here, or inside the function??
// I think here, because it can be re-used.. right?
const webhook = new Webhook();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
exports.handleUpdate = https.onRequest(async (req, res): Promise<any> => {
  // TODO: payload validation.
  console.log(JSON.stringify(req.body));

  if (!req.body.message) return res.status(200).send();

  const tgUserID = req.body.message.from.id;
  const tgUsername = req.body.message.from.username;

  console.log(tgUserID);
  console.log(tgUsername);

  // FIXME: the commands should be inside an interface or something.
  try {
    switch (req.body.message.text) {
      case "/start":
        await webhook.handleStart(tgUserID, tgUsername); break;
      case "/balance":
      case "👛 Balance":
        await webhook.handleBalance(tgUserID); break;
      case "/deposit":
      case "🏦 Deposit":
        await webhook.handleDeposit(tgUserID); break;
      case "/withdraw":
      case "🦮 Withdraw":
        await webhook.handleWithdrawal(tgUserID); break;
      case "/help":
      case "🆘 Help":
        await webhook.handleHelp(tgUserID); break;
      case "Cancel":
        await webhook.handleCancel(tgUserID); break;
      default:
        // TODO: should we do something here?
        return res.status(200).send();
    }

    return res.status(200).send();
  } catch (ex) {
    console.error(ex);
    return res.status(500).send(ex.message);
  }
});
