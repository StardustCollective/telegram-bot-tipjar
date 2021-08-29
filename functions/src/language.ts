
import {readFileSync} from "fs";

let currentInstance: Language;

/**
 * Language Class
 * Fetches all strings from language files, and makes them easily accessible
 * throughout the project.
 */
export class Language {
    en: any
    /**
     * @constructor
     */
    constructor() {
      this.en = JSON.parse(readFileSync("./lang/en.json").toString());
      console.log(this.en);
    }

    /**
     *
     * @return {Language} current instance of this class.
     */
    static getInstance(): Language {
      if (!currentInstance) {
        currentInstance = new Language();
      }

      return currentInstance;
    }

    /**
     *
     * @param {string} language the language to pick
     * @param {string} key the key from the language file
     * @param {string} tokens any tokens to be replaced,
     * inside the template string
     * @return {string} the translated string
     */
    getString(language: string, key: string, tokens: Array<string> ) : string {
      // FIXME: replace tokens in string, handle language key
      console.log(language);
      console.log(tokens);
      return this.en[key];
    }
}
