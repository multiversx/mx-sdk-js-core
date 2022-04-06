import { IAccountBalance, IAddress, INonce } from "./interface";
import { AccountBalance, Address, Nonce } from "./primitives";

/**
 * A plain view of an account, as queried from the Network.
 */
 export class AccountOnNetwork {
    address: IAddress = new Address("");
    nonce: INonce = new Nonce(0);
    balance: IAccountBalance = new AccountBalance("");
    code: string = "";
    userName: string = "";

    constructor(init?: Partial<AccountOnNetwork>) {
        Object.assign(this, init);
    }

    static fromHttpResponse(payload: any): AccountOnNetwork {
        let result = new AccountOnNetwork();

        result.address = new Address(payload["address"] || 0);
        result.nonce = new Nonce(payload["nonce"] || 0);
        result.balance = new AccountBalance(payload["balance"] || "0");
        result.code = payload["code"] || "";
        result.userName = payload["username"] || "";

        return result;
    }
}

