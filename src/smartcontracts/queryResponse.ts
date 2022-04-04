import { GasLimit } from "../networkParams";
import { MaxUint64 } from "./query";
import { ReturnCode } from "./returnCode";
import BigNumber from "bignumber.js";
import { ErrContract } from "../errors";
import { ArgSerializer } from "./argSerializer";

export class QueryResponse {
    returnData: string[];
    returnCode: ReturnCode;
    returnMessage: string;
    gasUsed: GasLimit;

    constructor(init?: Partial<QueryResponse>) {
        this.returnData = init?.returnData || [];
        this.returnCode = init?.returnCode || ReturnCode.Unknown;
        this.returnMessage = init?.returnMessage || "";
        this.gasUsed = init?.gasUsed || new GasLimit(0);
    }

    /**
     * Constructs a QueryResponse object from a HTTP response (as returned by the provider).
     */
    static fromHttpResponse(payload: any): QueryResponse {
        let returnData = <string[]>payload["returnData"] || payload["ReturnData"];
        let returnCode = payload["returnCode"] || payload["ReturnCode"];
        let returnMessage = payload["returnMessage"] || payload["ReturnMessage"];
        let gasRemaining = new BigNumber(payload["gasRemaining"] || payload["GasRemaining"] || 0);
        let gasUsed = new GasLimit(MaxUint64.minus(gasRemaining).toNumber());

        return new QueryResponse({
            returnData: returnData,
            returnCode: new ReturnCode(returnCode),
            returnMessage: returnMessage,
            gasUsed: gasUsed,
        });
    }

    getReturnCode(): ReturnCode {
        return this.returnCode;
    }

    getReturnMessage(): string {
        return this.returnMessage;
    }

    getReturnDataParts(): Buffer[] {
        return this.returnData.map((item) => Buffer.from(item || "", "base64"));
    }

    assertSuccess() {
        if (this.isSuccess()) {
            return;
        }

        throw new ErrContract(`${this.getReturnCode()}: ${this.getReturnMessage()}`);
    }

    isSuccess(): boolean {
        return this.returnCode.isSuccess();
    }

    /**
     * Converts the object to a pretty, plain JavaScript object.
     */
    toJSON(): object {
        return {
            success: this.isSuccess(),
            returnData: this.returnData,
            returnCode: this.returnCode,
            returnMessage: this.returnMessage,
            gasUsed: this.gasUsed.valueOf(),
        };
    }
}
