import {database, initializeApp} from "firebase-admin";
import {Telegram} from "./telegram";

/**
 * Class for handling all webhook calls.
 */
export class Webhook {
    // DEFAULT_MENU = [
    //   [
    //     {text: "👛 Balance"},
    //     {text: "🏦 Deposit"},
    //   ], [
    //     {text: "🦮 Withdraw"},
    //     {text: "🆘 Help"}],
    // ];
    telegram: Telegram

    /**
     * @constructor
     */
    constructor() {
      // TODO: maybe import language file or something??
      this.telegram = new Telegram();
      initializeApp();
    }

    /**
     * Handle the /start command.
     * @param {string} tgUserID - telegram user id
     * @param {string} tgUsername - telegram username
     * @return {Promise}
     */
    handleStart(tgUserID: string, tgUsername :string) : Promise<string> {
      console.log(tgUsername);
      // TODO: check if user exists, do nothing? throw error?

      // FIXME: use a schema.
      database().ref("users/" + tgUserID).set({
        username: tgUsername,
        wallet_id: "",
        private_key: "",
        created_ts: new Date().getTime(),
        updated_ts: new Date().getTime(),
      });

      return this.telegram.sendKeyboard(
          tgUserID, "Welcome ", [
            [{text: "👛 Balance"}, {text: "🏦 Deposit"}],
            [{text: "🦮 Withdraw"}, {text: "🆘 Help"}],
          ]
      );
    }

    /**
     * @param {string} tgUserID - telegram user id
     * @return {Promise}
     */
    handleBalance(tgUserID: string) : Promise<string> {
      return this.telegram.sendText(tgUserID, "meuk");
    }

    /**
     * @param {string} tgUserID - telegram user id
     * @return {Promise}
    */
    handleDeposit(tgUserID: string) : Promise<string> {
      // TODO: create DAG wallet after disclaimer is accepted
      // Or do we do this when user has read and accept disclaimer,
      // when trying to deposit?
      // const { privateKey, walletAddress, fullAddress }
      // = await DAG.createWallet()
      // const walletAddress = 'DAG8RvVRL9HCodC9n4WibddaLC3EKsbjz19hiNat'
      // const fullAddress = "DAG8RvVRL9HCodC9n4WibddaLC3EKsbjz19hiNat";
      // const privateKey = 'yolo'

      return this.telegram.sendText(tgUserID, "meuk");
    }

    /**
     * @param {string} tgUserID - telegram user id
     * @return {Promise}
     */
    handleWithdrawal(tgUserID: string) : Promise<string> {
      return this.telegram.sendText(tgUserID, "meuk");
    }

    /**
     * @param {string} tgUserID - telegram user id
     * @return {Promise}
     */
    handleHelp(tgUserID: string) : Promise<string> {
      return this.telegram.sendText(tgUserID, "meuk");
    }

    /**
     * @param {string} tgUserID - telegram user id
     * @return {Promise}
     */
    handleCancel(tgUserID: string) : Promise<string> {
      return this.telegram.sendText(tgUserID, "meuk");
    }
}
