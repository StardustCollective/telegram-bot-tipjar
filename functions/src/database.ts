/* eslint-disable max-len */
import {database, initializeApp} from "firebase-admin";
import {DataSnapshot} from "@firebase/database-types";

let currentInstance: Database;

/**
 * Class for handling all Firebase realtime-database calls.
 */
export class Database {
  /**
    * @constructor
    */
  constructor() {
    initializeApp();
  }

  /**
     *
     * @return {Database} current instance of the database.
     */
  static getInstance(): Database {
    if (!currentInstance) {
      currentInstance = new Database();
    }

    return currentInstance;
  }

  /**
     * Creates or updates a user.
     * @param {string} tgUserID - telegram user id
     * @param {string} tgUsername - telegram username
     * @return {Promise}
     */
  createOrUpdateUser(tgUserID: string, tgUsername: string): Promise<DataSnapshot> {
    return database().ref(`users/${tgUserID}/username`).once("value", (snapshot) => {
      if (snapshot.exists()) {
        return database().ref("users/" + tgUserID).update({username: tgUsername, updated_ts: new Date().getTime()});
      }

      return database().ref("users/" + tgUserID).set({
        username: tgUsername,
        wallet_id: "",
        private_key: "",
        created_ts: new Date().getTime(),
        updated_ts: new Date().getTime(),
      });
    });
  }
}
