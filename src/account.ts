import { Address } from "./address";
import { Nonce } from "./nonce";
import { Balance } from "./balance";
import { Egld } from "./balanceBuilder";
import { IAccountBalance, IAddress, INonce } from "./interface";

/**
 * An abstraction representing an account (user or Smart Contract) on the Network.
 */
export class Account {
    /**
     * The address of the account.
     */
    readonly address: IAddress = new Address();

    /**
     * The nonce of the account (the account sequence number).
     */
    nonce: Nonce = new Nonce(0);

    /**
     * The balance of the account.
     */
    balance: IAccountBalance = Egld("0");

    /**
     * Creates an account object from an address
     */
    constructor(address: IAddress) {
        this.address = address;
    }

    /**
     * Updates account properties (such as nonce, balance).
     */
    async update(obj: { nonce: INonce, balance: IAccountBalance}) {
        this.nonce = new Nonce(obj.nonce.valueOf());
        this.balance = Balance.fromString(obj.balance.toString());
    }

    /**
     * Increments (locally) the nonce (the account sequence number).
     */
    incrementNonce() {
        this.nonce = this.nonce.increment();
    }

    /**
     * Gets then increments (locally) the nonce (the account sequence number).
     */
    getNonceThenIncrement(): Nonce {
        let nonce = this.nonce;
        this.nonce = this.nonce.increment();
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
