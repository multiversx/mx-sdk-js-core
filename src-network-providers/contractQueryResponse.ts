import BigNumber from "bignumber.js";
import { MaxUint64AsBigNumber } from "./constants";

export class ContractQueryResponse {
    returnData: string[];
    returnCode: string;
    returnMessage: string;
    gasUsed: number;

    constructor(init?: Partial<ContractQueryResponse>) {
        this.returnData = init?.returnData || [];
        this.returnCode = init?.returnCode || "";
        this.returnMessage = init?.returnMessage || "";
        this.gasUsed = init?.gasUsed || 0;
    }

    /**
     * Constructs a QueryResponse object from a HTTP response (as returned by the provider).
     */
    static fromHttpResponse(payload: any): ContractQueryResponse {
        let returnData = <string[]>payload["returnData"] || payload["ReturnData"];
        let returnCode = payload["returnCode"] || payload["ReturnCode"];
        let returnMessage = payload["returnMessage"] || payload["ReturnMessage"];
        let gasRemaining = new BigNumber(payload["gasRemaining"] || payload["GasRemaining"] || 0);
        let gasUsed = MaxUint64AsBigNumber.minus(gasRemaining).toNumber();

        return new ContractQueryResponse({
            returnData: returnData,
            returnCode: returnCode,
            returnMessage: returnMessage,
            gasUsed: gasUsed,
        });
    }

    getReturnDataParts(): Buffer[] {
        return this.returnData.map((item) => Buffer.from(item || "", "base64"));
    }

    /**
     * Converts the object to a pretty, plain JavaScript object.
     */
    toJSON(): object {
        return {
            returnData: this.returnData,
            returnCode: this.returnCode,
            returnMessage: this.returnMessage,
            gasUsed: this.gasUsed.valueOf(),
        };
    }
}
