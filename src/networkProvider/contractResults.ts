import { BigNumber } from "bignumber.js";
import { IContractQueryResponse } from "../interface.networkProvider";
import { GasLimit } from "../networkParams";
import { ArgSerializer, EndpointDefinition, MaxUint64, ReturnCode, TypedValue } from "../smartcontracts";

export class ContractQueryResponse implements IContractQueryResponse {
    returnData: string[] = [];
    returnCode: ReturnCode = ReturnCode.None;
    returnMessage: string = "";
    gasUsed: GasLimit = new GasLimit(0);

    static fromHttpResponse(payload: any): ContractQueryResponse {
        let response = new ContractQueryResponse();
        let gasRemaining = new BigNumber(payload["gasRemaining"] || payload["GasRemaining"] || 0);

        response.returnData = payload["returnData"] || [];
        response.returnCode = payload["returnCode"] || "";
        response.returnMessage = payload["returnMessage"] || "";
        response.gasUsed = new GasLimit(MaxUint64.minus(gasRemaining).toNumber());

        return response;
    }

    getOutputUntyped(): Buffer[] {
        let buffers = this.returnData.map((item) => Buffer.from(item || "", "base64"));
        return buffers;
    }

    getOutputTyped(endpointDefinition: EndpointDefinition): TypedValue[] {
        let buffers = this.getOutputUntyped();
        let values = new ArgSerializer().buffersToValues(buffers, endpointDefinition!.output);
        return values;
    }
}
