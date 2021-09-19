
let currentInstance: Constellation;

/**
 * Constellation Class
 * Handles all communication with Constellation throughout the project.
 */
export class Constellation {
  /**
   * @constructor
   */
  constructor() {
    // Setup connection DAG4JS.
  }

  /**
    * @return {Database} a current instance of the DB
    */
  static getInstance(): Constellation {
    if (!currentInstance) {
      currentInstance = new Constellation();
    }

    return currentInstance;
  }

  /**
     * Creates a new wallet
     * @return {Promise} created wallet.
     */
  async createWallet(): Promise<string> {
    return "";
  }
}
