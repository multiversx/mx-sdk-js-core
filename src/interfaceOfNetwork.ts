import { Address } from "./address";
import { Balance } from "./balance";
import { Hash } from "./hash";
import { Nonce } from "./nonce";
import { TransactionHash, TransactionStatus } from "./transaction";
import { TransactionPayload } from "./transactionPayload";

export interface ITransactionOnNetwork {
    hash: TransactionHash;
    type: string;
    value: Balance;
    receiver: Address;
    sender: Address;
    data: TransactionPayload;
    status: TransactionStatus;
    receipt: ITransactionReceipt;
    contractResults: IContractResults;
    logs: ITransactionLogs;

    isCompleted(): boolean;
    getAllEvents(): ITransactionEvent[];
}

export interface ITransactionReceipt {
    data: string;
}

export interface IContractResults {
    items: IContractResultItem[];
}

export interface IContractResultItem {
    hash: Hash;
    nonce: Nonce;
    receiver: Address;
    sender: Address;
    data: string;
    returnMessage: string;
    logs: ITransactionLogs;
}

export interface ITransactionLogs {
    events: ITransactionEvent[];

    findSingleOrNoneEvent(identifier: string, predicate?: (event: ITransactionEvent) => boolean): ITransactionEvent | undefined;
    findFirstOrNoneEvent(identifier: string, predicate?: (event: ITransactionEvent) => boolean): ITransactionEvent | undefined;
    findEvents(identifier: string, predicate?: (event: ITransactionEvent) => boolean): ITransactionEvent[];
}

export interface ITransactionEvent {
    readonly address: Address;
    readonly identifier: string;
    readonly topics: ITransactionEventTopic[];
    readonly data: string;

    findFirstOrNoneTopic(predicate: (topic: ITransactionEventTopic) => boolean): ITransactionEventTopic | undefined;
    getLastTopic(): ITransactionEventTopic;
}

export interface ITransactionEventTopic {
    toString(): string;
    hex(): string;
}
