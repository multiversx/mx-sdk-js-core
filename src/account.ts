import { Address } from "./address";
import { Nonce } from "./nonce";
import { Balance } from "./balance";
import { Egld } from "./balanceBuilder";
import BigNumber from "bignumber.js";

/**
 * An abstraction representing an account (user or Smart Contract) on the Network.
 */
export class Account {
    /**
     * The address of the account.
     */
    readonly address: Address = new Address();

    /**
     * The nonce of the account (the account sequence number).
     */
    nonce: Nonce = new Nonce(0);

    /**
     * The balance of the account.
     */
    balance: Balance = Egld("0");

    /**
     * Creates an account object from an address
     */
    constructor(address: Address) {
        this.address = address;
    }

    /**
     * Updates account properties (such as nonce, balance).
     */
    async update(obj: { nonce: Nonce, balance: Balance}) {
        this.nonce = obj.nonce;
        this.balance = obj.balance;
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

/**
 * A plain view of an account, as queried from the Network.
 */
export class AccountOnNetwork {
    address: Address = new Address();
    nonce: Nonce = new Nonce(0);
    balance: Balance = Egld(0);
    code: string = "";
    userName: string = "";

    constructor(init?: Partial<AccountOnNetwork>) {
        Object.assign(this, init);
    }

    static fromHttpResponse(payload: any): AccountOnNetwork {
        let result = new AccountOnNetwork();

        result.address = new Address(payload["address"] || 0);
        result.nonce = new Nonce(payload["nonce"] || 0);
        result.balance = Balance.fromString(payload["balance"] || "0");
        result.code = payload["code"] || "";
        result.userName = payload["username"] || "";

        return result;
    }
}

export class TokenOfAccountOnNetwork {
    tokenIdentifier: string = "";
    attributes: Buffer = Buffer.from([]);
    balance: BigNumber = new BigNumber(0);
    nonce: Nonce = new Nonce(0);
    creator: Address = new Address("");
    royalties: BigNumber = new BigNumber(0);

    static fromHttpResponse(payload: any): TokenOfAccountOnNetwork {
        let result = new TokenOfAccountOnNetwork();

        result.tokenIdentifier = payload.tokenIdentifier;
        result.attributes = Buffer.from(payload.attributes || "", "base64");
        result.balance = new BigNumber(payload.balance || 0);
        result.nonce = new Nonce(payload.nonce || 0);
        result.creator = new Address(payload.creator || "");
        result.royalties = new BigNumber(payload.royalties || 0);

        return result;
    }
}
