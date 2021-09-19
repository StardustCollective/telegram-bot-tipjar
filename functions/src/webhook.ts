import {Database} from "./database";
import {Constellation} from "./constellation";
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
    async handleBalance(tgUserId: string) :
        Promise<string> {
      if (!await this.checkDisclaimerStatus(tgUserId)) return "";
      const tokens = new Map();
      tokens.set("balance", "X.XXXXXX");
      tokens.set("withdrawal_limit", "X.XXXXXX");
      tokens.set("sending_limit", "X.XXXXXX");
      return Telegram.getInstance().sendText(tgUserId,
          Language.getString( "en", "balance.text", tokens )
      );
    }

    /**
     * Show the disclaimer, with accept/decline buttons.
     * @param {string} tgUserId - telegram userID
     * @return {Promise}
     */
    async handleDisclaimer(tgUserId: string) : Promise<string> {
      return Telegram.getInstance().sendText(
          tgUserId,
          Language.getString( "en", "help.disclaimer"),
          [
            this._addKeyboardButton("en", "buttons.disclaimer.accept"),
            this._addKeyboardButton("en", "buttons.disclaimer.decline"),
          ]
      );
    }

    /**
     * @param {string} tgUserId - telegram user id
     * @return {Promise}
    */
    async handleDeposit(tgUserId: string) : Promise<string> {
      if (!await this.checkDisclaimerStatus(tgUserId)) return "";
      return Telegram.getInstance().sendText(tgUserId, "TODO");
    }

    /**
     * @param {string} tgUserId - telegram user id
     * @return {Promise}
     */
    async handleWithdrawal(tgUserId: string) : Promise<string> {
      if (!await this.checkDisclaimerStatus(tgUserId)) return "";
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
    async handleCallbackQuery(
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

      if (section === "disclaimer") {
        if (subject === "accept") {
          await this.acceptDisclaimer(tgUserId);
          return Telegram.getInstance().editMessage(
              chatId, messageId, Language.getString("en", "disclaimer.finished")
          );
        } else {
          return Telegram.getInstance().editMessage(
              chatId, messageId, Language.getString("en", "disclaimer.declined")
          );
        }
      }

      return Telegram.getInstance().editMessage(
          chatId, messageId, Language.getString("en", `${section}.${subject}`),
          [
            this._addKeyboardButton("en", `${section}.return`),
          ]
      );
    }

    /**
     * Accept our disclaimer, and creates a new wallet for the user.
     * @param {string} tgUserId - telegram userID
     * @return {Promise}
     */
    private async acceptDisclaimer(tgUserId: string) : Promise<string> {
      const user = await Database.getInstance().getUser(tgUserId);
      if (!user) {
        // FIXME: what we do here? user does not exist,
        // which should not happen..
        // could just create the user and continue?
        return Telegram.getInstance().sendText(tgUserId,
            "Cannot find your wallet, run /start to setup your wallet."
        );
      }

      const wallet = await Constellation.getInstance().createWallet();
      console.log(wallet);

      const walletId = "";
      const privateKey = "";

      return Database.getInstance().setWalletID(tgUserId, walletId, privateKey);
    }

    /**
     * Accept our disclaimer, and creates a new wallet for the user.
     * @param {string} tgUserId - telegram userID
     * @return {Promise}
     */
    private async checkDisclaimerStatus(tgUserId: string) : Promise<boolean> {
      const user = await Database.getInstance().getUser(tgUserId);
      if (!user) {
        // FIXME: what we do here? user does not exist,
        // which should not happen..
        // could just create the user and continue?
        await Telegram.getInstance().sendText(tgUserId,
            "Cannot find your wallet, run /start to setup your wallet."
        );
        return false;
      }

      if (!user.wallet_id) {
        // FIXME: better text/flow?
        await Telegram.getInstance().sendText(tgUserId,
            "You did not accept our disclaimer yet, " +
            "run /disclaimer to do so now."
        );
        return false;
      }

      return true;
    }
}
