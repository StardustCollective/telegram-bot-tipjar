import {Constellation} from "./constellation";
import {Database} from "./database";
import {DBUser} from "./user";
import {Language} from "./language";
import {Telegram} from "./telegram";
import {readdirSync} from "fs";

/**
 * Class for handling all webhook calls.
 */
export class Webhook {
    INLINE_KEYBOARD = false;
    LANGUAGES_FOLDER_PATH = './lang/';
    /**
     * Handle the /start command.
     * @param {string} userId - telegram user id
     * @param {string} username - telegram username
     * @return {Promise}
     */
    async handleStart(userId: string, username :string, userLanguage: string) : Promise<string> {
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
        userLanguage, "welcome", tokens
      );

      return Telegram.getInstance().sendText(
          userId, text, Language.getKeyboard(userLanguage, this.INLINE_KEYBOARD)
      );
    }

    /**
     * @param {string} userId - telegram user id
     * @return {Promise}
     */
    async handleBalance(userId: string, userLanguage: string) :
        Promise<string> {
      const user = await this.checkUser(userId, userLanguage);
      if (!user || !user.wallet) return "";
      await Database.getInstance().clearState(userId);

      const balance = await Constellation.getInstance()
          .getBalance(user.wallet);

      const tokens = new Map();
      tokens.set("balance", balance);
      return Telegram.getInstance().sendText(userId,
          Language.getString(userLanguage, "balance.text", tokens),
      );
    }

    /**
     * Show the disclaimer, with accept/decline buttons.
     * @param {string} userId - telegram userID
     * @return {Promise}
     */
    async handleDisclaimer(userId: string, userLanguage: string) : Promise<string> {
      await Database.getInstance().clearState(userId);
      return Telegram.getInstance().sendText(
          userId,
          Language.getString(userLanguage, "help.disclaimer"),
          {inline: true, keys: [
            this._addKeyboardButton(userLanguage, "buttons.disclaimer.accept"),
            this._addKeyboardButton(userLanguage, "buttons.disclaimer.decline"),
          ]}
      );
    }

    /**
     * @param {string} userId - telegram user id
     * @return {Promise}
    */
    async handleDeposit(userId: string, userLanguage: string) : Promise<string> {
      const user = await this.checkUser(userId, userLanguage);
      if (!user || !user.wallet) return "";
      if (!await this.checkDisclaimer(userId, user, userLanguage)) return "";
      await Database.getInstance().clearState(userId);

      const tokens = new Map();
      tokens.set("wallet_address", user.wallet.address);

      return Telegram.getInstance().sendText(
          userId,
          Language.getString(userLanguage, "deposit.text", tokens),
      );
    }

    /**
     * @param {string} userId - telegram user id
     * @return {Promise}
     */
    async handleWithdrawal(userId: string, userLanguage: string) : Promise<string> {
      const user = await this.checkUser(userId, userLanguage);
      if (!user || !user.wallet) return "";
      if (!await this.checkDisclaimer(userId, user, userLanguage)) return "";
      await Database.getInstance().clearState(userId);

      const balance = await Constellation.getInstance()
          .getBalance(user.wallet);

      const tokens = new Map();
      tokens.set("balance", balance);
      await Database.getInstance().setState(
          userId, {path: "withdrawal", section: "amount"}
      );
      return Telegram.getInstance().sendText(
          userId, Language.getString(userLanguage, "withdrawal.text", tokens),
          undefined, true
      );
    }

    /**
     * @param {string} userId - telegram user id
     * @param {UserSchema} user - DB user
     * @param {string} targetUsername - target user
     * @param {number} amount - the amount to tip target user.
     * @param {string} chatId - the ID of the chat the message originated from.
     * @return {Promise}
     */
    async handleTip(
        userId: string,
        user: UserSchema,
        targetUsername: string,
        amount: number,
        chatId: string,
        userLanguage: string,
        groupLanguage: string
    ) : Promise<string> {
      if (!user || !user.wallet) return "";

      const targetUser = await Database.getInstance()
          .getUserByUsername(targetUsername);

      if (!targetUser) {
        const targetUserData = new Map();
        targetUserData.set("recipient", targetUsername);

        await Telegram.getInstance().sendText(
            chatId,
            Language.getString(groupLanguage, "tip.target_user_setup", targetUserData)
        );

        return Telegram.getInstance().sendText(
            userId,
            Language.getString(userLanguage, "tip.invalid_target_user"),
            Language.getKeyboard(userLanguage, this.INLINE_KEYBOARD)
        );
      }

      const balance = await Constellation.getInstance()
          .getBalance(user.wallet);

      if (amount > balance) {
        return Telegram.getInstance().sendText(
            userId, Language.getString(userLanguage, "tip.insufficient_balance"),
            Language.getKeyboard(userLanguage, this.INLINE_KEYBOARD)
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
            sourceChatId: chatId,
            sourceUsername: user.username,
          }
      );

      return Telegram.getInstance().sendText(
          userId,
          Language.getString(userLanguage, "tip.confirm_text", tokens),
          {inline: true, keys: [
            this._addKeyboardButton(userLanguage, "buttons.tip.confirm"),
            this._addKeyboardButton(userLanguage, "buttons.tip.decline"),
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
     *
     * @param {ChatMember} chatMember member of a chat 
     * @return {boolean} true if the user is Admin or Creator
     */
    _userIsAdmin(chatMember: ChatMember): boolean {
      return chatMember.status ? chatMember.status === "administrator" || chatMember.status === "creator" : false;
    }

    _getAvailableLanguagesFromFiles() {
      return readdirSync(this.LANGUAGES_FOLDER_PATH).map((file: string) => file.split(".")[0]);
    }

    /**
     * @param {string} userId - telegram user id
     * @param {string} chatId - group chat id
     * @return {Promise}
     */
    async handleSetLanguage(
      userId: string,
      chatId: string,
      targetLanguage: string,
      groupLanguage: string
    ) : Promise<string> {
      if (!userId || !chatId) return "";

      const chatMember = await Telegram.getInstance().getGroupMemberData(chatId, userId);

      if (!chatMember || !this._userIsAdmin(chatMember)) {
        return Telegram.getInstance().sendText(
            chatId,
            Language.getString(groupLanguage, "language.not_admin"),
        );
      }

      const availableLanguages = this._getAvailableLanguagesFromFiles();

      if(!availableLanguages.includes(targetLanguage)){
        const tokens = new Map();
        tokens.set("available_languages", availableLanguages);
        return Telegram.getInstance().sendText(
          chatId, Language.getString(groupLanguage, "language.invalid_language", tokens));
      }

      await Database.getInstance().saveGroupLanguage(chatId, targetLanguage);
      return Telegram.getInstance().sendText(
        chatId,
        Language.getString(targetLanguage, "language.successful"))
      }

    /**
     * Handles default input, for now mainly withdrawal flow,
     * could be expanded to more later.
     * @param {string} userId the telegram user id
     * @param {string} input whatever the user input
     * @param {string} chatId the ID of the chat the command originated from
     * @return {Promise}
     */
    async handleDefault(
        userId: string,
        command: string,
        input: string,
        chatId: string,
        userLanguage: string,
        groupLanguage: string
    ) : Promise<string> {
      const user = await this.checkUser(userId, userLanguage);
      if (!user || !user.wallet) return "";

      if(input.startsWith("/setlanguage")){
        const [_, targetLanguage] = input?.split(" ");
        if(!targetLanguage){
          return Telegram.getInstance().sendText(
            chatId, Language.getString(groupLanguage, "language.invalid_format"));
        }
        return this.handleSetLanguage(userId, chatId, targetLanguage, groupLanguage);
      }

      if (command.startsWith("/tip")) {
        const [_, targetUsername, amount] = input?.split(" ");
        await Database.getInstance().clearState(userId);
        if (!targetUsername || !targetUsername.startsWith("@") || !amount) {
          return Telegram.getInstance().sendText(
              userId, Language.getString(userLanguage, "tip.invalid_format"),
              Language.getKeyboard(userLanguage, this.INLINE_KEYBOARD)
          );
        }

        // Allow users to send "1.01" or "1.01 DAG"
        const _amount = amount.replace("DAG", "").trim();

        const transferAmount = parseFloat(parseFloat(_amount).toFixed(8));
        if (!transferAmount) {
          return Telegram.getInstance().sendText(
              userId, Language.getString(userLanguage, "tip.invalid_amount"),
              Language.getKeyboard(userLanguage, this.INLINE_KEYBOARD)
          );
        }

        return this.handleTip(
            userId,
            user,
            targetUsername,
            transferAmount,
            chatId,
            userLanguage,
            groupLanguage
        );
      }

      const state = await Database.getInstance().getState(userId);
      if (!state) {
        return Telegram.getInstance().sendText(
          userId, Language.getString(userLanguage, "errors.not_found"),
          Language.getKeyboard(userLanguage, this.INLINE_KEYBOARD)
        );
      }

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
                userId, Language.getString(userLanguage, "withdrawal.invalid_amount")
            );
          } else if (withdrawalState.amount > balance) {
            await Database.getInstance().clearState(userId);
            return Telegram.getInstance().sendText(
                userId, Language.getString(userLanguage,
                    "withdrawal.insufficient_balance"
                ), Language.getKeyboard(userLanguage, this.INLINE_KEYBOARD)
            );
          }
          withdrawalState.section = "destination";
          await Database.getInstance().setState(userId, withdrawalState);
          return Telegram.getInstance().sendText(
              userId, Language.getString(userLanguage, "withdrawal.destination_text")
          );
        } else if (withdrawalState.section === "destination") {
          const tokens = new Map();
          tokens.set("amount", withdrawalState.amount);
          tokens.set("destination", input);
          if (user.wallet.address === input) {
            return Telegram.getInstance().sendText(
                userId, Language.getString(userLanguage,
                    "withdrawal.own_wallet", tokens
                )
            );
          }
          if (!Constellation.getInstance().validate(input)) {
            return Telegram.getInstance().sendText(
                userId, Language.getString(userLanguage,
                    "withdrawal.invalid_destination", tokens
                )
            );
          }
          withdrawalState.destinationAddress = input;
          await Database.getInstance().setState(userId, withdrawalState);
          return Telegram.getInstance().sendText(
              userId,
              Language.getString(userLanguage, "withdrawal.confirm_text", tokens),
              {inline: true, keys: [
                this._addKeyboardButton(userLanguage, "buttons.withdraw.confirm"),
                this._addKeyboardButton(userLanguage, "buttons.withdraw.decline"),
              ]}
          );
        }
      }

      return Telegram.getInstance().sendText(
        userId, Language.getString(userLanguage, "errors.not_found"),
        Language.getKeyboard(userLanguage, this.INLINE_KEYBOARD)
      );
    }

    /**
     * @param {string} userId - telegram user id
     * @param {string} chatId - if previous message should be edited.
     * @param {string} messageId - if previous message should be edited.
     * @return {Promise}
     */
    handleHelp(userId: string, userLanguage: string, chatId?: string, messageId?: string) :
    Promise<string> {
      const text = Language.getString(userLanguage, "help.title");
      const inlineKeyboard = {inline: true, keys: [
        this._addKeyboardButton(userLanguage, "buttons.help.get_started"),
        this._addKeyboardButton(userLanguage, "buttons.help.disclaimer"),
        this._addKeyboardButton(userLanguage, "buttons.help.about_us"),
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
     * @return {Promise}
     */
    async handleCallbackQuery(
        userId: string, chatId: string, messageId: string, data: string, userLanguage: string, groupLanguage: string
    ) : Promise<string> {
      data = data.replace("buttons.", "");
      const section = data.slice(0, data.indexOf("."));
      const subject = data.slice(data.indexOf(".") + 1);

      if (section === "help") {
        if (subject === "return") {
          return this.handleHelp(userId, userLanguage, chatId, messageId);
        }
      }
      const user = await this.checkUser(userId, userLanguage);
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

          const completedPublicParams = new Map();
          completedPublicParams.set("sender", "@" + state.sourceUsername);
          completedPublicParams.set("recipient", state.destinationUser);
          completedPublicParams.set("amount", state.amount);

          const sourceGroupLanguage = await Database.getInstance().getGroupLanguage(state.sourceChatId);
          await Telegram.getInstance().sendText(
              state.sourceChatId,
              Language.getString(
                sourceGroupLanguage,
                  "tip.completed_public",
                  completedPublicParams
              )
          );

          const tokens = new Map();
          tokens.set("hash", transferHash);
          return Telegram.getInstance().editMessage(
              chatId, messageId,
              Language.getString(groupLanguage, "tip.completed", tokens)
          );
        } else {
          return Telegram.getInstance().editMessage(
              chatId, messageId,
              Language.getString(groupLanguage, "tip.canceled")
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
              Language.getString(userLanguage, "withdrawal.completed")
          );
          return Telegram.getInstance().sendText(
              chatId,
              Language.getString(userLanguage, "withdrawal.post_completed", tokens)
          );
        } else {
          await Telegram.getInstance().editMessage(
              chatId, messageId,
              Language.getString(userLanguage, "withdrawal.canceled")
          );
          return Telegram.getInstance().sendText(
              chatId,
              Language.getString(userLanguage, "withdrawal.post_cancel")
          );
        }
      }

      if (section === "disclaimer") {
        if (subject === "accept") {
          user.acceptDisclaimer();
          await Database.getInstance().saveUser(userId, user);
          return Telegram.getInstance().editMessage(
              chatId, messageId, Language.getString(userLanguage, "disclaimer.finished")
          );
        } else {
          return Telegram.getInstance().editMessage(
              chatId, messageId, Language.getString(userLanguage, "disclaimer.declined")
          );
        }
      }

      return Telegram.getInstance().editMessage(
          chatId, messageId, Language.getString(userLanguage, `${section}.${subject}`),
          {inline: true, keys: [
            this._addKeyboardButton(userLanguage, `${section}.return`),
          ]}
      );
    }

    /**
     * Accept our disclaimer, and creates a new wallet for the user.
     * @param {string} userId - telegram userID
     * @return {Promise}
     */
    private async checkUser(userId: string, userLanguage: string) : Promise<DBUser | null> {
      const user = await Database.getInstance().getUser(userId);
      if (!user || !user.wallet) {
        await Telegram.getInstance().sendText(userId,
            Language.getString(userLanguage, "errors.wallet_not_found"),
            Language.getKeyboard(userLanguage, this.INLINE_KEYBOARD)
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
    private async checkDisclaimer(userId: string, user: DBUser, userLanguage: string)
        : Promise<boolean> {
      if (!user.acceptedDisclaimer) {
        await Telegram.getInstance().sendText(userId,
            Language.getString(userLanguage, "disclaimer.pending")
        );
        await this.handleDisclaimer(userId, userLanguage);
        return false;
      }

      return true;
    }
}
