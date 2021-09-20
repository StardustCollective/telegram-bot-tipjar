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
            accepted_dsc_ts: 0,
            created_ts: new Date().getTime(),
            updated_ts: new Date().getTime(),
          });
        });
  }


  /**
  * Gets an existing a user by telegram user id.
  * @param {string} userID - telegram user id
  * @return {Promise}
  */
  getUser(userID: string): Promise<any> {
    return new Promise((resolve, reject) => {
      database().ref(`users/${userID}`)
          .once("value", (snapshot) => {
            resolve(snapshot.val());
          }, (error) => {
            reject(error);
          });
    });
  }

  /**
  * Sets the walletID for a given user.
  * @param {string} userID - telegram user id
  * @param {string} walletID - constellation wallet id.
  * @param {string} privateKey - constellation wallet private key.
  * @return {Promise}
  */
  setWalletID(userID: string, walletID: string, privateKey: string):
    Promise<any> {
    return database().ref(`users/${userID}/username`)
        .once("value", (snapshot) => {
          if (snapshot.exists()) {
            return database().ref("users/" + userID).update({
              wallet_id: walletID,
              private_key: privateKey,
              updated_ts: new Date().getTime(),
            });
          }
          return null;
        });
  }

  /**
  * Sets disclaimer acceptance timestamp.
  * @param {string} userID - telegram user id
  * @return {Promise}
  */
  setDisclaimerAccepted(userID: string):
   Promise<any> {
    return database().ref(`users/${userID}/username`)
        .once("value", (snapshot) => {
          if (snapshot.exists()) {
            return database().ref("users/" + userID).update({
              accepted_dsc_ts: new Date().getTime(),
              updated_ts: new Date().getTime(),
            });
          }
          return null;
        });
  }
}
