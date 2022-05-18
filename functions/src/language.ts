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

  static getKeyboardStrings(
    language: string
){
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

    getKeyboard(
      userLanguage: string,
      inline: boolean
  ) : TelegramKeyboard {
    const {
      translatedBalance, 
      translatedHelp, 
      translatedDeposit, 
      translatedWithdraw
    } = currentInstance.getKeyboardTranslatedStrings(userLanguage);

    const keyboard: TelegramKeyboard = {inline: inline, keys: [
      [{text: translatedDeposit}, {text: translatedWithdraw}],
      [{text: translatedBalance}, {text: translatedHelp}]
    ]}

    return keyboard;
  }

  getKeyboardTranslatedStrings(userLanguage: string){
    const translatedBalance = currentInstance.reduceString(userLanguage, "keyboard.balance");
    const translatedHelp = currentInstance.reduceString(userLanguage, "keyboard.help");
    const translatedDeposit = currentInstance.reduceString(userLanguage, "keyboard.deposit");
    const translatedWithdraw = currentInstance.reduceString(userLanguage, "keyboard.withdraw");

    return {translatedBalance, translatedHelp, translatedDeposit, translatedWithdraw};
  }

  reduceString(userLanguage: string, path: string): any{
    const translations = this.translations[userLanguage] ?? this.translations[DEFAULT_LANGUAGE];
    const translated = path.split(".").reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (currentObject :any, property :string) =>
        currentObject?.[property], translations);

    if (!translated) throw new Error("Missing translation");
    return translated;
  }
}
