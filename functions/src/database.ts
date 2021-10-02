import {config} from "firebase-functions";
import {database, initializeApp} from "firebase-admin";
import {DataSnapshot} from "@firebase/database-types";
import {DBUser} from "./user";

let currentInstance: Database;

/**
 * Class for handling all Firebase realtime-database calls.
 */
export class Database {
  /**
   * @constructor
   */
  constructor() {
    if (config().env.production) {
      initializeApp({databaseURL: config().env.database_url});
    } else {
      initializeApp();
    }
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
  * Creates an new a user by telegram user id, and saves it to DB.
  * @param {string} userID - telegram user id
  * @param {string} username - telegram username
  * @return {Promise} returns DB
  */
  async createUser(userID: string, username: string): Promise<DBUser> {
    const user = new DBUser(username);
    await database().ref(`users/${userID}`).set(user);
    return user;
  }

  /**
  * Gets an existing a user by telegram user id.
  * @param {string} userID - telegram user id
  * @return {Promise} returns DB
  */
  async getUser(userID: string): Promise<DBUser | null> {
    const snapshot = await database().ref(`users/${userID}`)
        .once("value", (snapshot) => snapshot);

    return DBUser.fromSnapshot(snapshot);
  }

  /**
  * Updates given DBUser in database
  * @param {string} userID - telegram user id
  * @param {DBUser} user - db user object
  * @return {Promise}
  */
  saveUser(userID : string, user: DBUser): Promise<DataSnapshot> {
    if (!userID) throw new Error("UserID cannot be empty!");
    user.updatedTS = new Date().getTime();
    return database().ref(`users/${userID}`).update(user);
  }

  /**
   *
   * @param {string} userID - telegram user id
   * @param {string} path - telegram user id
   * @return {Promise}
   */
  async getState(userID : string) : Promise<State | WithdrawalState> {
    const snapshot = await database().ref(`state/${userID}`)
        .once("value", (snapshot) => snapshot);

    return snapshot.val();
  }

  /**
   *
   * @param {string} userID - telegram user id
   * @param {string} state - State object
   * @param {any} payload - extra payload for state
   * @return {Promise}
   */
  setState(userID : string, state : State | WithdrawalState) : Promise<void> {
    return database().ref(`state/${userID}`).update(state);
  }

  /**
   *
   * @param {string} userID - telegram user id
   * @param {string} state - State object
   * @param {any} payload - extra payload for state
   * @return {Promise}
   */
  clearState(userID : string) : Promise<void> {
    return database().ref(`state/${userID}`).remove();
  }
}
