import { ErrContract } from "../../errors";
import { IContractQueryResponse } from "../../interfaceOfNetwork";
import { ArgSerializer } from "../argSerializer";
import { ReturnCode } from "../returnCode";
import { EndpointDefinition } from "../typesystem";
import { TypedResult } from "./deprecatedContractResults";

export namespace Result {

    export interface IResult {
        getReturnCode(): ReturnCode;
        getReturnMessage(): string;
        isSuccess(): boolean;
        assertSuccess(): void;
    }

    export function isSuccess(result: IResult): boolean {
        return result.getReturnCode().isSuccess();
    }

    export function assertSuccess(result: IResult): void {
        if (result.isSuccess()) {
            return;
        }

        throw new ErrContract(`${result.getReturnCode()}: ${result.getReturnMessage()}`);
    }

    export function unpackQueryOutput(endpoint: EndpointDefinition, queryResponse: IContractQueryResponse) {
        if (!queryResponse.isSuccess()) {
            throw new ErrContract(`${queryResponse.returnCode}: ${queryResponse.returnMessage}`);
        }

        let buffers = queryResponse.getReturnDataParts();
        let typedValues = new ArgSerializer().buffersToValues(buffers, endpoint.output);
        let values = typedValues.map((value) => value?.valueOf());
        if (values.length <= 1) {
            return values[0];
        }
        return values;
    }

    export function unpackExecutionOutput(endpoint: EndpointDefinition, result: TypedResult) {
        let buffers = result.outputUntyped();
        let typedValues = new ArgSerializer().buffersToValues(buffers, endpoint.output);
        let values =  typedValues.map((value) => value?.valueOf());
        if (values.length <= 1) {
            return values[0];
        }
        return values;
    }
}
