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
      const tokens = new Map();
      tokens.set("username", tgUsername);
      const text = Language.getString(
          "en", "welcome", tokens
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
     *
     * @param {string} language the language to use
     * @param {string} path the path of translation
     * @return {Array} a TG formatted keyboard button
     */
    _addKeyboardButton(language :string, path :string)
        : Array<Record<string, string>> {
      return [{
        "text": Language.getString(language, path),
        "callback_data": path,
      }];
    }

    /**
     * @param {string} tgUserId - telegram user id
     * @param {string} chatId - if previous message should be edited.
     * @param {string} messageId - if previous message should be edited.
     * @return {Promise}
     */
    handleHelp(tgUserId: string, chatId?: string, messageId?: string) :
    Promise<string> {
      const text = Language.getString( "en", "help.title");
      const inlineKeyboard = [
        this._addKeyboardButton("en", "buttons.help.get_started"),
        this._addKeyboardButton("en", "buttons.help.disclaimer"),
        this._addKeyboardButton("en", "buttons.help.how_to_deposit"),
        this._addKeyboardButton("en", "buttons.help.how_to_withdrawal"),
        this._addKeyboardButton("en", "buttons.help.how_to_check_balance"),
        this._addKeyboardButton("en", "buttons.help.about_us"),
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
      data = data.replace("buttons.", "");
      const section = data.slice(0, data.indexOf("."));
      const subject = data.slice(data.indexOf(".") + 1);

      // TODO: improve, with more flows.
      if (subject === "return") {
        if (section === "help") {
          return this.handleHelp(tgUserId, chatId, messageId);
        }
      }

      return Telegram.getInstance().editMessage(
          chatId, messageId, Language.getString("en", `${section}.${subject}`),
          [
            this._addKeyboardButton("en", `${section}.return`),
          ]
      );
    }
}
