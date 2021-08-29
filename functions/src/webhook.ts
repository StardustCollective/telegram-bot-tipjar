import {Database} from "./database";
import {Language} from "./language";
import {Telegram} from "./telegram";

/**
 * Class for handling all webhook calls.
 */
export class Webhook {
    DEFAULT_MENU = [
      [{text: "👛 Balance"}, {text: "🏦 Deposit"}],
      [{text: "🦮 Withdraw"}, {text: "🆘 Help"}],
    ];

    /**
     * Handle the /start command.
     * @param {string} tgUserId - telegram user id
     * @param {string} tgUsername - telegram username
     * @return {Promise}
     */
    async handleStart(tgUserId: string, tgUsername :string) : Promise<string> {
      await Database.getInstance().createOrUpdateUser(tgUserId, tgUsername);

      const text = Language.getString(
          "en", "welcome", [tgUsername]
      );

      return Telegram.getInstance().sendKeyboard(
          tgUserId, text, this.DEFAULT_MENU
      );
    }

    /**
     * @param {string} tgUserId - telegram user id
     * @return {Promise}
     */
    handleBalance(tgUserId: string) : Promise<string> {
      return Telegram.getInstance().sendText(tgUserId, "TODO");
    }

    /**
     * @param {string} tgUserId - telegram user id
     * @return {Promise}
    */
    handleDeposit(tgUserId: string) : Promise<string> {
      return Telegram.getInstance().sendText(tgUserId, "TODO");
    }

    /**
     * @param {string} tgUserId - telegram user id
     * @return {Promise}
     */
    handleWithdrawal(tgUserId: string) : Promise<string> {
      return Telegram.getInstance().sendText(tgUserId, "TODO");
    }

    /**
     * @param {string} tgUserId - telegram user id
     * @param {string} chatId - if previous message should be edited.
     * @param {string} messageId - if previous message should be edited.
     * @return {Promise}
     */
    handleHelp(tgUserId: string, chatId?: string, messageId?: string) :
    Promise<string> {
      const text = Language.getString( "en", "help_title");
      const inlineKeyboard = [
        [{
          "text": Language.getString( "en", "help_get_started"),
          "callback_data": "help_get_started",
        }],
        [{
          "text": Language.getString( "en", "help_get_started"),
          "callback_data": "help_disclaimer",
        }],
        [{
          "text": Language.getString( "en", "help_get_started"),
          "callback_data": "help_how_to_deposit",
        }],
        [{
          "text": Language.getString( "en", "help_get_started"),
          "callback_data": "help_how_to_withdrawal",
        }],
        [{
          "text": Language.getString( "en", "help_get_started"),
          "callback_data": "help_how_to_check_balance",
        }],
        [{
          "text": Language.getString( "en", "help_get_started"),
          "callback_data": "help_about_us",
        }],
      ];

      if (chatId && messageId) {
        return Telegram.getInstance().editMessage(
            chatId, messageId, text, inlineKeyboard
        );
      }

      return Telegram.getInstance().sendText(
          tgUserId, text, inlineKeyboard
      );
    }

    /**
     *
     * @param {string} tgUserId
     * @param {string} chatId
     * @param {string} messageId
     * @param {string} data
     * @return {Prromise}
     */
    handleCallbackQuery(
        tgUserId: string, chatId: string, messageId: string, data: string
    ) : Promise<string> {
      const section = data.slice(0, data.indexOf("_"));
      const subject = data.slice(data.indexOf("_") + 1);

      if (subject === "cancel") {
        // TODO: improve
        if (section === "help") {
          return this.handleHelp(tgUserId, chatId, messageId);
        }
      }

      return Telegram.getInstance().editMessage(
          chatId, messageId, `<TODO text for ${section}-${subject}>`,
          [[{
            "text": Language.getString( "en", "return"),
            "callback_data": `${section}_cancel`},
          ]]
      );
    }

    /**
     * @param {string} tgUserId - telegram user id
     * @return {Promise}
     */
    handleCancel(tgUserId: string) : Promise<string> {
      return Telegram.getInstance().sendText(tgUserId, "TODO");
    }
}
