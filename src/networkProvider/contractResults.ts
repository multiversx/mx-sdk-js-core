import { BigNumber } from "bignumber.js";
import { Address } from "../address";
import { Balance } from "../balance";
import { Hash } from "../hash";
import { IContractQueryResponse, IContractResultItem, IContractResults, ITransactionLogs } from "./interface";
import { GasLimit, GasPrice } from "../networkParams";
import { Nonce } from "../nonce";
import { TransactionHash } from "../transaction";
import { TransactionLogs } from "./transactionLogs";
import { ReturnCode } from "../smartcontracts/returnCode";
import { MaxUint64 } from "../smartcontracts/query";

export class ContractResults implements IContractResults {
    readonly items: IContractResultItem[];

    constructor(items: IContractResultItem[]) {
        this.items = items;

        this.items.sort(function (a: IContractResultItem, b: IContractResultItem) {
            return a.nonce.valueOf() - b.nonce.valueOf();
        });
    }

    static empty(): ContractResults {
        return new ContractResults([]);
    }

    static fromProxyHttpResponse(results: any[]): ContractResults {
        let items = results.map(item => ContractResultItem.fromProxyHttpResponse(item));
        return new ContractResults(items);
    }

    static fromApiHttpResponse(results: any[]): ContractResults {
        let items = results.map(item => ContractResultItem.fromApiHttpResponse(item));
        return new ContractResults(items);
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
    logs: ITransactionLogs = TransactionLogs.empty();

    constructor(init?: Partial<IContractResultItem>) {
        Object.assign(this, init);
    }


    static fromProxyHttpResponse(response: any): ContractResultItem {
        let item = ContractResultItem.fromHttpResponse(response);
        return item;
    }

    static fromApiHttpResponse(response: any): ContractResultItem {
        let item = ContractResultItem.fromHttpResponse(response);

        item.data = Buffer.from(item.data, "base64").toString();
        item.callType = Number(item.callType);

        return item;
    }

    private static fromHttpResponse(response: any): ContractResultItem {
        let item = new ContractResultItem();

        item.hash = new TransactionHash(response.hash);
        item.nonce = new Nonce(response.nonce || 0);
        item.value = Balance.fromString(response.value);
        item.receiver = new Address(response.receiver);
        item.sender = new Address(response.sender);
        item.previousHash = new TransactionHash(response.prevTxHash);
        item.originalHash = new TransactionHash(response.originalTxHash);
        item.gasLimit = new GasLimit(response.gasLimit);
        item.gasPrice = new GasPrice(response.gasPrice);
        item.data = response.data || "";
        item.callType = response.callType;
        item.returnMessage = response.returnMessage;

        item.logs = TransactionLogs.fromHttpResponse(response.logs || {});

        return item;
    }
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

    getReturnDataParts(): Buffer[] {
        return this.returnData.map((item) => Buffer.from(item || ""));
    }
}
