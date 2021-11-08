
import {readFileSync} from "fs";

const PLACEHOLDER_LANG = new RegExp(/{{(.*?)}}/g);
let currentInstance: Language;

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

    /**
     *
     * @param {string} language the language to pick
     * @param {string} path the key from the language file
     * @param {string} tokens any tokens to be replaced,
     * inside the template string
     * @return {string} the translated string
     */
    getString(
        language: string, path: string, tokens: Map<string, string> = new Map()
    ) : string {
      const translated = path.split(".").reduce(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (currentObject :any, property :string) =>
            currentObject?.[property], this.translations[language]);
      if (tokens.size > 0) {
        return translated
            .replace(PLACEHOLDER_LANG,
                (_: string, capturedText: string) => tokens.get(capturedText));
      }

      if (!translated) throw new Error("Missing translation");
      return translated;
    }
}
