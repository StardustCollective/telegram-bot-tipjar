import {DataSnapshot} from "@firebase/database-types";
import {Wallet} from "./wallet";

interface UserSchema {
    username: string,
    wallet?: Wallet,
    acceptedDisclaimerTS: number,
    createdTS: number,
    updatedTS: number
}

/**
 * DBUser class
 * Representing the user from database.
 */
export class DBUser implements UserSchema {
    username: string
    wallet?: Wallet
    acceptedDisclaimerTS: number
    createdTS: number
    updatedTS: number

    /**
     * Constructor
     * @param {string} username telegram username
     */
    constructor(username : string) {
      this.username = username;
      this.acceptedDisclaimerTS = 0;
      this.createdTS = new Date().getTime();
      this.updatedTS = new Date().getTime();
    }

    /**
     * Creates a DBUser object from given snapshot.
     * @param {DataSnapshot} snapshot Firebase RealtimeDB snapshot
     * @return {DBUser} initalized DBuser object
     */
    static fromSnapshot = (snapshot : DataSnapshot)
        : DBUser | null => {
      const data = snapshot.val();
      if (!data) return null;

      const user = new DBUser(data.username);
      Object.assign(user, data);
      return user;
    };

    /**
     * Returns wether the user has accepted the disclaimer or not.
     * @return {boolean} True/false based on disclaimer accepted or not.
     */
    get acceptedDisclaimer() : boolean {
      return this.acceptedDisclaimerTS !== 0;
    }

    /**
     * Sets accepted disclaimer flag.
     */
    acceptDisclaimer() : void {
      this.acceptedDisclaimerTS = new Date().getTime();
    }
}
