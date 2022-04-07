import { createProxyNetworkProvider } from "@elrondnetwork/erdjs-network-providers";
import { IAccountBalance, IBech32Address, IHash, INonce } from "../interface";
import { IAccountOnNetwork, IContractQueryResponse, INetworkConfig, ITransactionEventTopic, ITransactionOnNetwork, ITransactionStatus } from "../interfaceOfNetwork";
import { Query } from "../smartcontracts/query";
import { Transaction } from "../transaction";

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
