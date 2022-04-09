import { IBech32Address } from "./interface";
import { Bech32Address } from "./primitives";

/**
 * A plain view of an account, as queried from the Network.
 */
 export class AccountOnNetwork {
    address: IBech32Address = new Bech32Address("");
    nonce: number = 0;
    balance: string = "";
    code: string = "";
    userName: string = "";

    constructor(init?: Partial<AccountOnNetwork>) {
        Object.assign(this, init);
    }

    static fromHttpResponse(payload: any): AccountOnNetwork {
        let result = new AccountOnNetwork();

        result.address = new Bech32Address(payload["address"] || 0);
        result.nonce = Number(payload["nonce"] || 0);
        result.balance = (payload["balance"] || 0).toString();
        result.code = payload["code"] || "";
        result.userName = payload["username"] || "";

        return result;
    }
}

