import { ErrContract } from "../../errors";
import { ArgSerializer } from "../argSerializer";
import { ReturnCode } from "../returnCode";
import { EndpointDefinition, TypedValue } from "../typesystem";

export namespace Result {

    export interface IResult {
        getReturnCode(): ReturnCode;
        getReturnMessage(): string;
        isSuccess(): boolean;
        assertSuccess(): void;
        outputUntyped(): Buffer[];
        outputTyped(): TypedValue[];
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

    export function outputTyped(endpointDefinition: EndpointDefinition, result: IResult) {
        result.assertSuccess();

        let buffers = result.outputUntyped();
        let values = new ArgSerializer().buffersToValues(buffers, endpointDefinition.output);
        return values;
    }


    export function unpackOutput(result: IResult) {
        let values = result.outputTyped().map((value) => value?.valueOf());
        if (values.length <= 1) {
            return values[0];
        }
        return values;
    }
}
