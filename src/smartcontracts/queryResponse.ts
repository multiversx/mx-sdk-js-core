import { GasLimit } from "../networkParams";
import { EndpointDefinition, TypedValue } from "./typesystem";
import { MaxUint64 } from "./query";
import { ReturnCode } from "./returnCode";
import BigNumber from "bignumber.js";
import { Result } from "./result";

export class QueryResponse implements Result.IResult {
    /**
     * If available, will provide typed output arguments (with typed values).
     */
    private endpointDefinition?: EndpointDefinition;

    returnData: string[];
    returnCode: ReturnCode;
    returnMessage: string;
    gasUsed: GasLimit;

    constructor(init?: Partial<QueryResponse>) {
        this.returnData = init?.returnData || [];
        this.returnCode = init?.returnCode || ReturnCode.Unknown;
        this.returnMessage = init?.returnMessage || "";
        this.gasUsed = init?.gasUsed || GasLimit.min();
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

    getEndpointDefinition(): EndpointDefinition | undefined {
        return this.endpointDefinition;
    }
    getReturnCode(): ReturnCode {
        return this.returnCode;
    }
    getReturnMessage(): string {
        return this.returnMessage;
    }
    unpackOutput(): any {
        return Result.unpackOutput(this);
    }

    assertSuccess() {
        Result.assertSuccess(this);
    }

    isSuccess(): boolean {
        return this.returnCode.isSuccess();
    }

    setEndpointDefinition(endpointDefinition: EndpointDefinition): void {
        this.endpointDefinition = endpointDefinition;
    }

    outputUntyped(): Buffer[] {
        this.assertSuccess();

        let buffers = this.returnData.map((item) => Buffer.from(item || "", "base64"));
        return buffers;
    }

    outputTyped(): TypedValue[] {
        return Result.outputTyped(this);
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
