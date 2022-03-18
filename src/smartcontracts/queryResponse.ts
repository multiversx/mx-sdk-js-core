import { GasLimit } from "../networkParams";
import { EndpointDefinition, TypedValue } from "./typesystem";
import { MaxUint64 } from "./query";
import { ReturnCode } from "./returnCode";
import BigNumber from "bignumber.js";
import { ErrContract } from "../errors";
import { guardValueIsSet } from "../utils";
import { ArgSerializer } from "./argSerializer";

export class QueryResponse {
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

    assertSuccess() {
        if (this.isSuccess()) {
            return;
        }

        throw new ErrContract(`${this.getReturnCode()}: ${this.getReturnMessage()}`);
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
        this.assertSuccess();

        let endpointDefinition = this.getEndpointDefinition();
        guardValueIsSet("endpointDefinition", endpointDefinition);

        let buffers = this.outputUntyped();
        let values = new ArgSerializer().buffersToValues(buffers, endpointDefinition!.output);
        return values;
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
