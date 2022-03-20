import { Address } from "../address";
import { Balance } from "../balance";
import { Hash } from "../hash";
import { GasLimit, GasPrice } from "../networkParams";
import { Nonce } from "../nonce";
import { TransactionHash } from "../transaction";
import { ArgSerializer } from "./argSerializer";

export class SmartContractResults {
    private readonly items: SmartContractResultItem[] = [];

    constructor(items: SmartContractResultItem[]) {
        this.items = items;
    }

    static empty(): SmartContractResults {
        return new SmartContractResults([]);
    }

    static fromHttpResponse(smartContractResults: any[]): SmartContractResults {
        let items = (smartContractResults || []).map((item: any) => SmartContractResultItem.fromHttpResponse(item));
        return new SmartContractResults(items);
    }

    getAll(): SmartContractResultItem[] {
        return this.items;
    }
}

export class SmartContractResultItem {
    constructor(init?: Partial<SmartContractResultItem>) {
        Object.assign(this, init);
    }

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

    static fromHttpResponse(response: {
        hash: string,
        nonce: number,
        value: string,
        receiver: string,
        sender: string,
        data: string,
        prevTxHash: string,
        originalTxHash: string,
        gasLimit: number,
        gasPrice: number,
        callType: number,
        returnMessage: string
    }): SmartContractResultItem {
        let item = new SmartContractResultItem();

        item.hash = new TransactionHash(response.hash);
        item.nonce = new Nonce(response.nonce || 0);
        item.value = Balance.fromString(response.value);
        item.receiver = new Address(response.receiver);
        item.sender = new Address(response.sender);
        item.data = response.data || "";
        item.previousHash = new TransactionHash(response.prevTxHash);
        item.originalHash = new TransactionHash(response.originalTxHash);
        item.gasLimit = new GasLimit(response.gasLimit);
        item.gasPrice = new GasPrice(response.gasPrice);
        item.callType = response.callType;

        return item;
    }

    getDataParts(): Buffer[] {
        return new ArgSerializer().stringToBuffers(this.data);
    }
}
