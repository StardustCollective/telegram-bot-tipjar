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
   * @return {Database} a current instance of the DB
   */
  static getInstance(): Database {
    if (!currentInstance) {
      currentInstance = new Database();
    }

    return currentInstance;
  }

  /**
  * Creates or updates a user.
  * @param {string} userID - telegram user id
  * @param {string} username - telegram username
  * @return {Promise}
  */
  createOrUpdateUser(userID: string, username: string): Promise<DataSnapshot> {
    return database().ref(`users/${userID}/username`)
        .once("value", (snapshot) => {
          if (snapshot.exists()) {
            return database().ref("users/" + userID).update(
                {username: username, updated_ts: new Date().getTime()}
            );
          }

          return database().ref("users/" + userID).set({
            username: username,
            wallet_id: "",
            private_key: "",
            created_ts: new Date().getTime(),
            updated_ts: new Date().getTime(),
          });
        });
  }
}
