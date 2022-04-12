import BigNumber from "bignumber.js";
import { IAddress } from "./interface";
import { Address } from "./primitives";

/**
 * A plain view of an account, as queried from the Network.
 */
 export class AccountOnNetwork {
    address: IAddress = new Address("");
    nonce: number = 0;
    balance: BigNumber = new BigNumber(0);
    code: string = "";
    userName: string = "";

    constructor(init?: Partial<AccountOnNetwork>) {
        Object.assign(this, init);
    }

    static fromHttpResponse(payload: any): AccountOnNetwork {
        let result = new AccountOnNetwork();

        result.address = new Address(payload["address"] || 0);
        result.nonce = Number(payload["nonce"] || 0);
        result.balance = new BigNumber(payload["balance"] || 0);
        result.code = payload["code"] || "";
        result.userName = payload["username"] || "";

        return result;
    }
}

