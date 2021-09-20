import {config} from "firebase-functions";
import {dag4} from "@stardust-collective/dag4";
import fetch from "node-fetch";

let currentInstance: Constellation;

/**
 * Constellation Class
 * Handles all communication with Constellation throughout the project.
 */
export class Constellation {
    libURL: string

    /**
   * @constructor
   */
    constructor() {
      if (config().env.production) {
      // MAIN_NET
        dag4.network.config({
          id: "main",
          beUrl: "https://block-explorer.constellationnetwork.io",
          lbUrl: "http://lb.constellationnetwork.io:9000",
        });
      } else {
        // TESTNET
        dag4.network.config({
          id: "ceres",
          beUrl: "https://api-be.exchanges.constellationnetwork.io",
          lbUrl: "http://lb.exchanges.constellationnetwork.io:9000",
        });
      }
      dag4.di.useFetchHttpClient(fetch);

      this.libURL = dag4.network.getNetwork().lbUrl;
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
    async createWallet(): Promise<any> {
      const privateKey = await dag4.keyStore.generatePrivateKey();
      const address = await dag4.keyStore
          .getDagAddressFromPrivateKey(privateKey);

      return {
        privateKey,
        address,
        fullAddress: `${this.libURL}/address/${address}`,
      };
    }

    /**
   * Retrieves current balance for given DAG wallet address
   * @param {string} address DAG wallet address
   * @return {Promise} the balance of the given wallet.
   */
    async getBalance(address: string) : Promise<number> {
    // TODO: always validate address, or does constellation handle this already?
      const result = await dag4.network.loadBalancerApi
          .getAddressBalance(address);

      if (!result || !result.balance) return 0;
      return result.balance;
    }
}
