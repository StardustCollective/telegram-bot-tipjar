import {Constellation} from "./constellation";
import {Database} from "./database";
import {DBUser} from "./user";
import {Language} from "./language";
import {Telegram} from "./telegram";

/**
 * Class for handling all webhook calls.
 */
export class Webhook {
    DEFAULT_KEYBOARD = {inline: false, keys: [
      [{text: "💰 Deposit"}, {text: "💸 Withdraw"}],
      [{text: "👛 Balance"}, {text: "🆘 Help"}],
    ]};

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

      return Telegram.getInstance().sendText(
          userId, text, this.DEFAULT_KEYBOARD
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
      await Database.getInstance().clearState(userId);

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
      await Database.getInstance().clearState(userId);
      return Telegram.getInstance().sendText(
          userId,
          Language.getString( "en", "help.disclaimer"),
          {inline: true, keys: [
            this._addKeyboardButton("en", "buttons.disclaimer.accept"),
            this._addKeyboardButton("en", "buttons.disclaimer.decline"),
          ]}
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
      await Database.getInstance().clearState(userId);

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
      if (!user || !user.wallet) return "";
      if (!await this.checkDisclaimer(userId, user)) return "";
      await Database.getInstance().clearState(userId);

      const balance = await Constellation.getInstance()
          .getBalance(user.wallet);

      const tokens = new Map();
      tokens.set("balance", balance);
      await Database.getInstance().setState(
          userId, {path: "withdrawal", section: "amount"}
      );
      return Telegram.getInstance().sendText(
          userId, Language.getString( "en", "withdrawal.text", tokens),
          undefined, true
      );
    }

    /**
     * @param {string} userId - telegram user id
     * @param {UserSchema} user - DB user
     * @param {string} targetUsername - target user
     * @param {number} amount - the amount to tip target user.
     * @return {Promise}
     */
    async handleTip(
        userId: string,
        user: UserSchema,
        targetUsername: string,
        amount: number
    ) : Promise<string> {
      if (!user || !user.wallet) return "";
      const targetUser = await Database.getInstance()
          .getUserByUsername(targetUsername);
      if (!targetUser) {
        return Telegram.getInstance().sendText(
            userId, Language.getString( "en", "tip.invalid_target_user"),
            this.DEFAULT_KEYBOARD
        );
      }
      const balance = await Constellation.getInstance()
          .getBalance(user.wallet);
      if (amount > balance) {
        return Telegram.getInstance().sendText(
            userId, Language.getString( "en", "tip.insufficient_balance"),
            this.DEFAULT_KEYBOARD
        );
      }

      const tokens = new Map();
      tokens.set("amount", amount);
      tokens.set("destination", targetUsername);

      if (!targetUser.wallet) {
        throw new Error("Got no wallet, should be impossible.");
      }
      await Database.getInstance().setState(
          userId, {
            path: "tip",
            section: "confirmation",
            amount: amount,
            destinationAddress: targetUser.wallet.address,
            destinationUser: targetUsername,
          }
      );
      return Telegram.getInstance().sendText(
          userId,
          Language.getString( "en", "tip.confirm_text", tokens),
          {inline: true, keys: [
            this._addKeyboardButton("en", "buttons.tip.confirm"),
            this._addKeyboardButton("en", "buttons.tip.decline"),
          ]}
      );
    }

    /**
     *
     * @param {string} language the language to use
     * @param {string} path the path of translation
     * @return {TelegramKeyboardButton} a TG formatted keyboard button
     */
    _addKeyboardButton(language :string, path :string)
        : TelegramKeyboardButton {
      return [{
        text: Language.getString(language, path),
        callback_data: path,
      }];
    }

    /**
     * Handles default input, for now mainly withdrawal flow,
     * could be expanded to more later.
     * @param {string} userId the telegram user id
     * @param {string} input whatever the user input
     * @return {Promise}
     */
    async handleDefault(userId: string, input: string) : Promise<string> {
      const user = await this.checkUser(userId);
      if (!user || !user.wallet) return "";

      const [cmd, targetUsername, amount] = input.split(" ");
      if (cmd === "/tip") {
        await Database.getInstance().clearState(userId);
        if (!targetUsername || !targetUsername.startsWith("@") || !amount) {
          return Telegram.getInstance().sendText(
              userId, Language.getString( "en", "tip.invalid_format"),
              this.DEFAULT_KEYBOARD
          );
        }

        const transferAmount = parseFloat(parseFloat(amount).toFixed(8));
        if (!transferAmount) {
          return Telegram.getInstance().sendText(
              userId, Language.getString( "en", "tip.invalid_amount"),
              this.DEFAULT_KEYBOARD
          );
        }

        return this.handleTip(userId, user, targetUsername, transferAmount);
      }

      const state = await Database.getInstance().getState(userId);
      if (!state) return "";

      if (state.path === "withdrawal") {
        const withdrawalState = state as WithdrawalState;
        if (withdrawalState.section === "amount") {
          withdrawalState.amount = parseFloat(parseFloat(input).toFixed(8));
          const balance = await Constellation.getInstance()
              .getBalance(user.wallet);

          if (
            !withdrawalState.amount ||
              isNaN(withdrawalState.amount) ||
              withdrawalState.amount < 0
          ) {
            return Telegram.getInstance().sendText(
                userId, Language.getString( "en", "withdrawal.invalid_amount")
            );
          } else if (withdrawalState.amount > balance) {
            await Database.getInstance().clearState(userId);
            return Telegram.getInstance().sendText(
                userId, Language.getString( "en",
                    "withdrawal.insufficient_balance"
                ), this.DEFAULT_KEYBOARD
            );
          }
          withdrawalState.section = "destination";
          await Database.getInstance().setState(userId, withdrawalState);
          return Telegram.getInstance().sendText(
              userId, Language.getString( "en", "withdrawal.destination_text")
          );
        } else if (withdrawalState.section === "destination") {
          const tokens = new Map();
          tokens.set("amount", withdrawalState.amount);
          tokens.set("destination", input);
          if (user.wallet.address === input) {
            return Telegram.getInstance().sendText(
                userId, Language.getString( "en",
                    "withdrawal.own_wallet", tokens
                )
            );
          }
          if (!Constellation.getInstance().validate(input)) {
            return Telegram.getInstance().sendText(
                userId, Language.getString( "en",
                    "withdrawal.invalid_destination", tokens
                )
            );
          }
          withdrawalState.destinationAddress = input;
          await Database.getInstance().setState(userId, withdrawalState);
          return Telegram.getInstance().sendText(
              userId,
              Language.getString( "en", "withdrawal.confirm_text", tokens),
              {inline: true, keys: [
                this._addKeyboardButton("en", "buttons.withdraw.confirm"),
                this._addKeyboardButton("en", "buttons.withdraw.decline"),
              ]}
          );
        }
      }

      return "";
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
      const inlineKeyboard = {inline: true, keys: [
        this._addKeyboardButton("en", "buttons.help.get_started"),
        this._addKeyboardButton("en", "buttons.help.disclaimer"),
        this._addKeyboardButton("en", "buttons.help.about_us"),
      ]};

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

      if (section === "help") {
        if (subject === "return") {
          return this.handleHelp(userId, chatId, messageId);
        }
      }

      const user = await this.checkUser(userId);
      if (!user) return "";

      if (section === "tip") {
        if (subject === "confirm") {
          const state = await Database.getInstance()
              .getState(userId) as TipState;

          if (!user.wallet) {
            throw new Error("Got no wallet, should be impossible.");
          }

          if (!state.destinationAddress || !state.amount) {
            throw new Error("Got invalid tip state, should be impossible.");
          }

          const transferHash = await Constellation.getInstance().transfer(
              user.wallet, state.destinationAddress, state.amount
          );

          const tokens = new Map();
          tokens.set("hash", transferHash);
          return Telegram.getInstance().editMessage(
              chatId, messageId,
              Language.getString("en", "tip.completed", tokens)
          );
        } else {
          return Telegram.getInstance().editMessage(
              chatId, messageId,
              Language.getString("en", "tip.canceled")
          );
        }
      }

      if (section === "withdraw") {
        const state = await Database.getInstance()
            .getState(userId) as WithdrawalState;

        await Database.getInstance().clearState(userId);
        if (subject === "confirm") {
          if (!user.wallet) {
            throw new Error("Got no wallet, should be impossible.");
          }

          if (!state.destinationAddress || !state.amount) {
            throw new Error(
                "Got invalid withdrawal state, should be impossible."
            );
          }

          const transferHash = await Constellation.getInstance().transfer(
              user.wallet, state.destinationAddress, state.amount
          );

          const tokens = new Map();
          tokens.set("hash", transferHash);
          await Telegram.getInstance().editMessage(
              chatId, messageId,
              Language.getString("en", "withdrawal.completed")
          );
          return Telegram.getInstance().sendText(
              chatId,
              Language.getString("en", "withdrawal.post_completed", tokens),
              this.DEFAULT_KEYBOARD
          );
        } else {
          await Telegram.getInstance().editMessage(
              chatId, messageId,
              Language.getString("en", "withdrawal.canceled")
          );
          return Telegram.getInstance().sendText(
              chatId,
              Language.getString("en", "withdrawal.post_cancel"),
              this.DEFAULT_KEYBOARD
          );
        }
      }

      if (section === "disclaimer") {
        if (subject === "accept") {
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
          {inline: true, keys: [
            this._addKeyboardButton("en", `${section}.return`),
          ]}
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
        await Telegram.getInstance().sendText(userId,
            Language.getString("en", "errors.wallet_not_found")
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
        await Telegram.getInstance().sendText(userId,
            Language.getString("en", "disclaimer.pending")
        );
        await this.handleDisclaimer(userId);
        return false;
      }

      return true;
    }
}
