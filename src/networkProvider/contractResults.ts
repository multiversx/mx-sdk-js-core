import { BigNumber } from "bignumber.js";
import { Address } from "../address";
import { Balance } from "../balance";
import { Hash } from "../hash";
import { IContractQueryResponse, IContractResultItem, IContractResults } from "../interface.networkProvider";
import { GasLimit, GasPrice } from "../networkParams";
import { Nonce } from "../nonce";
import { ArgSerializer, EndpointDefinition, MaxUint64, ReturnCode, TypedValue } from "../smartcontracts";

export class ContractResults implements IContractResults {
    readonly items: IContractResultItem[];

    constructor(items: IContractResultItem[]) {
        this.items = items;
    }

    static empty(): ContractResults {
        return new ContractResults([]);
    }
}

export class ContractResultItem implements IContractResultItem {
    hash: Hash = Hash.empty();
    nonce: Nonce = new Nonce(0);
    value: Balance = Balance.Zero();
    receiver: Address = new Address();
    sender: Address = new Address();
    data: string = "";
    previousHash: Hash = Hash.empty();
    originalHash: Hash = Hash.empty();
    gasLimit: GasLimit = new GasLimit(0);
    gasPrice: GasPrice = new GasPrice(0);
    callType: number = 0;
    returnMessage: string = "";
}

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
