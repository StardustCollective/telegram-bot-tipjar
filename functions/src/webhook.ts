import {Constellation} from "./constellation";
import {Database} from "./database";
import {DBUser} from "./models/user";
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
     * @param {string} userId - telegram user id
     * @param {string} username - telegram username
     * @return {Promise}
     */
    async handleStart(userId: string, username :string) : Promise<string> {
      let user = await Database.getInstance().getUser(userId);
      if (!user) {
        user = await Database.getInstance().createUser(userId, username);
      }
      // Always keep username up to date in DB.
      if (user.username !== username) {
        user.username = username;
        await Database.getInstance().saveUser(userId, user);
      }
      if (!user.wallet) {
        const wallet = await Constellation.getInstance().createWallet();
        user.wallet = wallet;
        user.updatedTS = new Date().getTime();
        await Database.getInstance().saveUser(userId, user);
      }

      const tokens = new Map();
      tokens.set("username", username);
      const text = Language.getString(
          "en", "welcome", tokens
      );

      return Telegram.getInstance().sendKeyboard(
          userId, text, this.DEFAULT_MENU
      );
    }

    /**
     * @param {string} userId - telegram user id
     * @return {Promise}
     */
    async handleBalance(userId: string) :
        Promise<string> {
      const user = await this.checkUser(userId);
      if (!user || !user.wallet) return "";

      const balance = await Constellation.getInstance()
          .getBalance(user.wallet);

      const tokens = new Map();
      tokens.set("balance", balance);
      return Telegram.getInstance().sendText(userId,
          Language.getString( "en", "balance.text", tokens )
      );
    }

    /**
     * Show the disclaimer, with accept/decline buttons.
     * @param {string} userId - telegram userID
     * @return {Promise}
     */
    async handleDisclaimer(userId: string) : Promise<string> {
      return Telegram.getInstance().sendText(
          userId,
          Language.getString( "en", "help.disclaimer"),
          [
            this._addKeyboardButton("en", "buttons.disclaimer.accept"),
            this._addKeyboardButton("en", "buttons.disclaimer.decline"),
          ]
      );
    }

    /**
     * @param {string} userId - telegram user id
     * @return {Promise}
    */
    async handleDeposit(userId: string) : Promise<string> {
      const user = await this.checkUser(userId);
      if (!user || !user.wallet) return "";
      if (!await this.checkDisclaimer(userId, user)) return "";

      const tokens = new Map();
      tokens.set("wallet_address", user.wallet.address);

      return Telegram.getInstance().sendText(
          userId,
          Language.getString( "en", "deposit.text", tokens),
      );
    }

    /**
     * @param {string} userId - telegram user id
     * @return {Promise}
     */
    async handleWithdrawal(userId: string) : Promise<string> {
      const user = await this.checkUser(userId);
      if (!user) return "";
      if (!await this.checkDisclaimer(userId, user)) return "";

      return Telegram.getInstance().sendText(userId, "TODO");
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
     * @param {string} userId - telegram user id
     * @param {string} chatId - if previous message should be edited.
     * @param {string} messageId - if previous message should be edited.
     * @return {Promise}
     */
    handleHelp(userId: string, chatId?: string, messageId?: string) :
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
          userId, text, inlineKeyboard
      );
    }

    /**
     *
     * @param {string} userId
     * @param {string} chatId
     * @param {string} messageId
     * @param {string} data
     * @return {Prromise}
     */
    async handleCallbackQuery(
        userId: string, chatId: string, messageId: string, data: string
    ) : Promise<string> {
      data = data.replace("buttons.", "");
      const section = data.slice(0, data.indexOf("."));
      const subject = data.slice(data.indexOf(".") + 1);

      // TODO: improve, with more flows.
      if (subject === "return") {
        if (section === "help") {
          return this.handleHelp(userId, chatId, messageId);
        }
      }

      if (section === "disclaimer") {
        if (subject === "accept") {
          const user = await this.checkUser(userId);
          if (!user) return "";
          user.acceptDisclaimer();
          await Database.getInstance().saveUser(userId, user);
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
     * @param {string} userId - telegram userID
     * @return {Promise}
     */
    private async checkUser(userId: string) : Promise<DBUser | null> {
      const user = await Database.getInstance().getUser(userId);
      if (!user || !user.wallet) {
        // FIXME: what we do here? user does not exist,
        // which should not happen..
        // could just create the user and continue?
        await Telegram.getInstance().sendText(userId,
            "Cannot find your wallet, run /start to setup your wallet."
        );
        return null;
      }

      return user;
    }


    /**
     * Accept our disclaimer, and creates a new wallet for the user.
     * @param {string} userId - telegram userID
     * @param {any} user - db user
     * @return {Promise}
     */
    private async checkDisclaimer(userId: string, user: DBUser)
        : Promise<boolean> {
      if (!user.acceptedDisclaimer) {
        // FIXME: better text/flow?
        await Telegram.getInstance().sendText(userId,
            "You did not accept our disclaimer yet, " +
              "run /disclaimer to do so now."
        );
        return false;
      }

      return true;
    }
}
