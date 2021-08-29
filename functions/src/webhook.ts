import {Database} from "./database";
import {Language} from "./language";
import {Telegram} from "./telegram";

/**
 * Class for handling all webhook calls.
 */
export class Webhook {
    DEFAULT_MENU = [
      [
        {text: "👛 Balance"},
        {text: "🏦 Deposit"},
      ], [
        {text: "🦮 Withdraw"},
        {text: "🆘 Help"}],
    ];

    /**
     * Handle the /start command.
     * @param {string} tgUserID - telegram user id
     * @param {string} tgUsername - telegram username
     * @return {Promise}
     */
    async handleStart(tgUserID: string, tgUsername :string) : Promise<string> {
      await Database.getInstance().createOrUpdateUser(tgUserID, tgUsername);

      const text = Language.getInstance().getString(
          "en", "welcome", [tgUsername]
      );

      return Telegram.getInstance().sendKeyboard(
          tgUserID, text, this.DEFAULT_MENU
      );
    }

    /**
     * @param {string} tgUserID - telegram user id
     * @return {Promise}
     */
    handleBalance(tgUserID: string) : Promise<string> {
      return Telegram.getInstance().sendText(tgUserID, "TODO");
    }

    /**
     * @param {string} tgUserID - telegram user id
     * @return {Promise}
    */
    handleDeposit(tgUserID: string) : Promise<string> {
      return Telegram.getInstance().sendText(tgUserID, "TODO");
    }

    /**
     * @param {string} tgUserID - telegram user id
     * @return {Promise}
     */
    handleWithdrawal(tgUserID: string) : Promise<string> {
      return Telegram.getInstance().sendText(tgUserID, "TODO");
    }

    /**
     * @param {string} tgUserID - telegram user id
     * @return {Promise}
     */
    handleHelp(tgUserID: string) : Promise<string> {
      return Telegram.getInstance().sendText(tgUserID, "TODO");
    }

    /**
     * @param {string} tgUserID - telegram user id
     * @return {Promise}
     */
    handleCancel(tgUserID: string) : Promise<string> {
      return Telegram.getInstance().sendText(tgUserID, "TODO");
    }
}
