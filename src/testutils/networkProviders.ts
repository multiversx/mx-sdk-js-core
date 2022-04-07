import { createProxyNetworkProvider } from "@elrondnetwork/erdjs-network-providers";
import { Address } from "../address";
import { Hash } from "../hash";
import { IAccountBalance, IBech32Address, IHash, INonce, ITransactionPayload, ITransactionValue } from "../interface";
import { IAccountOnNetwork, IContractQueryResponse, IContractResultItem, IContractResults, IContractReturnCode, INetworkConfig, ITransactionEvent, ITransactionEventTopic, ITransactionLogs, ITransactionOnNetwork, ITransactionReceipt, ITransactionStatus } from "../interfaceOfNetwork";
import { Query } from "../smartcontracts/query";
import { Transaction } from "../transaction";
import { TransactionPayload } from "../transactionPayload";

export function createLocalnetProvider(): INetworkProvider {
    return createProxyNetworkProvider("http://localhost:7950", { timeout: 5000 });
}

export interface INetworkProvider {
    getNetworkConfig(): Promise<INetworkConfig>;
    getAccount(address: IBech32Address): Promise<IAccountOnNetwork>;
    getTransaction(txHash: IHash): Promise<ITransactionOnNetwork>;
    getTransactionStatus(txHash: IHash): Promise<ITransactionStatus>;
    sendTransaction(tx: Transaction): Promise<IHash>;
    simulateTransaction(tx: Transaction): Promise<any>;
    queryContract(query: Query): Promise<IContractQueryResponse>;
}

export class MockAccountOnNetwork implements IAccountOnNetwork {
    nonce: INonce;
    balance: IAccountBalance;

    constructor(obj: {nonce: INonce, balance: IAccountBalance}) {
        this.nonce = obj.nonce;
        this.balance = obj.balance;
    }
}

export class MockTransactionOnNetwork implements ITransactionOnNetwork {
    hash: IHash = new Hash("");
    type: string = "";
    value: ITransactionValue = "";
    receiver: IBech32Address = new Address();
    sender: IBech32Address = new Address();
    data: ITransactionPayload = new TransactionPayload();
    status: ITransactionStatus = new MockTransactionStatus("");
    receipt: ITransactionReceipt = new MockTransactionReceipt();
    contractResults: IContractResults = new MockContractResults([]);
    logs: ITransactionLogs = new MockTransactionLogs();
    
    constructor(init?: Partial<ITransactionOnNetwork>) {
        Object.assign(this, init);
    }

    isCompleted(): boolean {
        throw new Error("Method not implemented.");
    }
}

export class MockTransactionStatus implements ITransactionStatus {
    value: string = "";

    constructor(value: string) {
        this.value = value;
    }

    isPending(): boolean {
        return this.value == "pending";
    }

    isFailed(): boolean {
        return this.value == "failed";
    }

    isInvalid(): boolean {
        return this.value == "invalid";
    }

    isExecuted(): boolean {
        return this.value == "executed";
    }
}

export class MockTransactionReceipt implements ITransactionReceipt {
    data: string = "";
}

export class MockContractResults implements IContractResults {
    items: IContractResultItem[] = [];

    constructor(items: IContractResultItem[]) {
        this.items = items;
    }
}

export class MockContractResultItem implements IContractResultItem {
    hash: IHash = new Hash("");
    nonce: INonce = 0;
    receiver: IBech32Address = new Address();
    sender: IBech32Address = new Address();
    data: string = "";
    returnMessage: string = "";
    logs: ITransactionLogs = new MockTransactionLogs;

    constructor(init?: Partial<IContractResultItem>) {
        Object.assign(this, init);
    }
}

export class MockTransactionLogs implements ITransactionLogs {
    events: ITransactionEvent[] = [];

    findSingleOrNoneEvent(_identifier: string, _predicate?: (event: ITransactionEvent) => boolean): ITransactionEvent | undefined {
        throw new Error("Method not implemented.");
    }
    
    findFirstOrNoneEvent(_identifier: string, _predicate?: (event: ITransactionEvent) => boolean): ITransactionEvent | undefined {
        throw new Error("Method not implemented.");
    }

    findEvents(_identifier: string, _predicate?: (event: ITransactionEvent) => boolean): ITransactionEvent[] {
        throw new Error("Method not implemented.");
    }
}

export class MockTransactionEventTopic implements ITransactionEventTopic {
    value: Buffer;

    constructor(valueBase64: string) {
        this.value = Buffer.from(valueBase64, "base64");
    }

    toString(): string {
        return this.value.toString();
    }

    hex(): string {
        return this.value.toString("hex");
    }
}

export class MockContractQueryResponse implements IContractQueryResponse {
    returnCode: IContractReturnCode = "";
    returnMessage: string = "";
    dataParts: Buffer[] = [];

    constructor(init?: Partial<MockContractQueryResponse>) {
        Object.assign(this, init);
    }

    getReturnDataParts(): Buffer[] {
        return this.dataParts;
    }
}
