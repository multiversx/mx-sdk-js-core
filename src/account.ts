import { Address } from "./address";
import { IAccountBalance, IAddress, INonce } from "./interface";

/**
 * An abstraction representing an account (user or Smart Contract) on the Network.
 */
export class Account {
    /**
     * The address of the account.
     */
    readonly address: IAddress = Address.empty();

    /**
     * The nonce of the account (the account sequence number).
     */
    nonce: INonce = 0;

    /**
     * The balance of the account.
     */
    balance: IAccountBalance = "0";

    /**
     * Creates an account object from an address
     */
    constructor(address: IAddress) {
        this.address = address;
    }

    /**
     * Updates account properties (such as nonce, balance).
     */
    update(obj: { nonce: INonce; balance: IAccountBalance }) {
        this.nonce = obj.nonce;
        this.balance = obj.balance;
    }

    /**
     * Increments (locally) the nonce (the account sequence number).
     */
    incrementNonce() {
        this.nonce = this.nonce.valueOf() + 1;
    }

    /**
     * Gets then increments (locally) the nonce (the account sequence number).
     */
    getNonceThenIncrement(): INonce {
        let nonce = this.nonce;
        this.nonce = this.nonce.valueOf() + 1;
        return nonce;
    }

    /**
     * Converts the account to a pretty, plain JavaScript object.
     */
    toJSON(): any {
        return {
            address: this.address.bech32(),
            nonce: this.nonce.valueOf(),
            balance: this.balance.toString(),
        };
    }
}
