
import {readFileSync} from "fs";

const PLACEHOLDER_LANG = new RegExp(/{{(.*?)}}/g);
let currentInstance: Language;

/**
 * Language Class
 * Fetches all strings from language files, and makes them easily accessible
 * throughout the project.
 */
export class Language {
    translations: any
    /**
     * @constructor
     */
    constructor() {
      this.translations = [];
      this.translations["en"] =
        JSON.parse(readFileSync("./lang/en.json").toString());
    }

    /**
     *
     * @param {string} language the language to pick
     * @param {string} key the key from the language file
     * @param {string} tokens any tokens to be replaced,
     * inside the template string
     * @return {string} the translated string
     */
    static getString(
        language: string, key: string, tokens?: Map<string, string>
    ): string {
      if (!currentInstance) currentInstance = new Language();
      return currentInstance.getString(language, key, tokens);
    }

    /**
     *
     * @param {string} language the language to pick
     * @param {string} key the key from the language file
     * @param {string} tokens any tokens to be replaced,
     * inside the template string
     * @return {string} the translated string
     */
    getString(language: string, key: string,
        tokens: Map<string, string> = new Map()) : string {
      // FIXME: still broken
      if (tokens.size > 0) {
        return (this.translations[language][key] || "")
            .replace(PLACEHOLDER_LANG, (
                placeholder: string, capturedText: string
            ) => tokens.get(capturedText));
      }

      return this.translations[language][key] || "<Missing Translation>";
    }
}
