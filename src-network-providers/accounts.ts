import { IBech32Address } from "./interface";
import { AccountBalance, Bech32Address } from "./primitives";

/**
 * A plain view of an account, as queried from the Network.
 */
 export class AccountOnNetwork {
    address: IBech32Address = new Bech32Address("");
    nonce: number = 0;
    balance: AccountBalance = new AccountBalance("");
    code: string = "";
    userName: string = "";

    constructor(init?: Partial<AccountOnNetwork>) {
        Object.assign(this, init);
    }

    static fromHttpResponse(payload: any): AccountOnNetwork {
        let result = new AccountOnNetwork();

        result.address = new Bech32Address(payload["address"] || 0);
        result.nonce = Number(payload["nonce"] || 0);
        result.balance = new AccountBalance(payload["balance"] || "0");
        result.code = payload["code"] || "";
        result.userName = payload["username"] || "";

        return result;
    }
}

