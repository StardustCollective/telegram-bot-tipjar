import {dag4} from "@stardust-collective/dag4";

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
    dag4.account.connect({networkVersion: "2.0", testnet: false});
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
  async createWallet(): Promise<Wallet> {
    const privateKey = await dag4.keyStore.generatePrivateKey();
    const address = await dag4.keyStore
        .getDagAddressFromPrivateKey(privateKey);

    return {
      privateKey,
      address,
    };
  }

  /**
   * Retrieves current balance for given DAG wallet address
   * @param {Wallet} wallet DAG wallet
   * @return {Promise} the balance of the given wallet.
   */
  async getBalance(wallet: Wallet) : Promise<number> {
    const result = await dag4.network.getAddressBalance(wallet.address);
    if (!result || !result.balance) return 0;
    return parseFloat((result.balance * 1e-8).toFixed(8));
  }

  /**
     * Transfer amount from wallet to destination address.
     *
     * @param {Wallet} wallet source wallet
     * @param {string} destAddr the destination address
     * @param {number} amount the amount to transfer
     * @return {Promise<string>} the transaction hash
     */
  async transfer(
      wallet: Wallet, destAddr : string, amount: number
  ) : Promise<string> {
    dag4.account.loginPrivateKey(wallet.privateKey);
    const transfer = await dag4.account.transferDag(destAddr, amount);
    return transfer.hash;
  }

  /**
     * Validates a given address at Constellation API.
     * @param {string} address the address to validate
     * @return {boolean} if the given address is valid.
     */
  validate(address : string) : boolean {
    return dag4.keyStore.validateDagAddress(address);
  }
}
