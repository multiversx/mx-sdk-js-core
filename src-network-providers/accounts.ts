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

        result.address = new Address(payload["address"] || "");
        result.nonce = Number(payload["nonce"] || 0);
        result.balance = new BigNumber(payload["balance"] || 0);
        result.code = payload["code"] || "";
        result.userName = payload["username"] || "";

        return result;
    }
}

export class GuardianData {
    guarded: boolean = false;
    activeGuardian?: Guardian;
    pendingGuardian?: Guardian;

    constructor(init?: Partial<GuardianData>) {
        Object.assign(this, init);
    }

    static fromHttpResponse(response: any): GuardianData {
        const result = new GuardianData();

        result.guarded = response["guarded"] || false;

        if (response["activeGuardian"]) {
            result.activeGuardian = Guardian.fromHttpResponse(response["activeGuardian"]);
        }

        if (response["pendingGuardian"]) {
            result.pendingGuardian = Guardian.fromHttpResponse(response["pendingGuardian"]);
        }

        return result;
    }

    getCurrentGuardianAddress(): IAddress | undefined {
        if (!this.guarded) {
            return undefined;
        }

        return this.activeGuardian?.address;
    }
}

class Guardian {
    activationEpoch: number = 0;
    address: IAddress = new Address("");
    serviceUID: string = "";

    static fromHttpResponse(responsePart: any): Guardian {
        const result = new Guardian();

        result.activationEpoch = Number(responsePart["activationEpoch"] || 0);
        result.address = new Address(responsePart["address"] || "");
        result.serviceUID = responsePart["serviceUID"] || "";

        return result;
    }
}
