import {readFileSync} from "fs";

const PLACEHOLDER_LANG = new RegExp(/{{(.*?)}}/g);
let currentInstance: Language;
const DEFAULT_LANGUAGE = "en";

/**
 * Language Class
 * Fetches all strings from language files, and makes them easily accessible
 * throughout the project.
 */
export class Language {
    translations: Record<string, string>
    /**
     * @constructor
     */
    constructor() {
      this.translations = {
        "en": JSON.parse(readFileSync("./lang/en.json").toString()),
        "es": JSON.parse(readFileSync("./lang/es.json").toString()),
      };
    }

    /**
     *
     * @param {string} language the language to pick
     * @param {string} path the key from the language file
     * @param {string} tokens any tokens to be replaced,
     * inside the template string
     * @return {string} the translated string
     */
    static getString(
        language: string, path: string, tokens?: Map<string, string>
    ): string {
      if (!currentInstance) currentInstance = new Language();
      return currentInstance.getString(language, path, tokens);
    }

    static getKeyboard(
      language: string, inline: boolean
  ): TelegramKeyboard {
    if (!currentInstance) currentInstance = new Language();
    return currentInstance.getKeyboard(language, inline);
  }

  /**
     *
     * @param {string} language the language to pick
     * @return {TranslatedKeyboardStrings} the translated string
     */
  static getKeyboardStrings(
    language: string
): TranslatedKeyboardStrings {
  if (!currentInstance) currentInstance = new Language();
  return currentInstance.getKeyboardTranslatedStrings(language);
}

    /**
     *
     * @param {string} userLanguage the language to pick
     * @param {string} path the key from the language file
     * @param {string} tokens any tokens to be replaced,
     * inside the template string
     * @return {string} the translated string
     */
    getString(
        userLanguage: string, path: string, tokens: Map<string, string> = new Map()
    ) : string {
      const translated = currentInstance.reduceString(userLanguage, path);
      if (tokens.size > 0) {
        return translated
            .replace(PLACEHOLDER_LANG,
                (_: string, capturedText: string) => tokens.get(capturedText));
      }

      if (!translated) throw new Error("Missing translation");
      return translated;
    }

    /**
     *
     * @param {string} language the language to pick
     * @param {boolean} inline should the keyboard be integrated with the message
     * @return {TelegramKeyboard} the keyboard to use in telegram
     */
    getKeyboard(
      language: string,
      inline: boolean
  ) : TelegramKeyboard {
    const {
      translatedBalance, 
      translatedHelp, 
      translatedDeposit, 
      translatedWithdraw
    }: TranslatedKeyboardStrings = currentInstance.getKeyboardTranslatedStrings(language);

    const keyboard: TelegramKeyboard = {inline: inline, keys: [
      [{text: translatedDeposit}, {text: translatedWithdraw}],
      [{text: translatedBalance}, {text: translatedHelp}]
    ]}

    return keyboard;
  }

    /**
     *
     * @param {string} language the language to pick
     * @return {TranslatedKeyboardStrings} the keyboard to use in telegram
     */
  getKeyboardTranslatedStrings(language: string): TranslatedKeyboardStrings{
    const translatedBalance = currentInstance.reduceString(language, "keyboard.balance");
    const translatedHelp = currentInstance.reduceString(language, "keyboard.help");
    const translatedDeposit = currentInstance.reduceString(language, "keyboard.deposit");
    const translatedWithdraw = currentInstance.reduceString(language, "keyboard.withdraw");

    return {translatedBalance, translatedHelp, translatedDeposit, translatedWithdraw};
  }

  /**
     *
     * @param {string} language the language to pick
     * @param {string} path should the keyboard be integrated with the message
     * @return {any} translated string
     */
  reduceString(language: string, path: string){
    const translations = this.translations[language] ?? this.translations[DEFAULT_LANGUAGE];
    const translated = path.split(".").reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (currentObject :any, property :string) =>
        currentObject?.[property], translations);

    if (!translated) throw new Error("Missing translation");
    return translated;
  }
}
