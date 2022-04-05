import { Address } from "./address";
import { Balance } from "./balance";
import { Hash } from "./hash";
import { GasLimit, GasPrice } from "./networkParams";
import { Nonce } from "./nonce";
import { Signature } from "./signature";
import { TransactionHash, TransactionStatus } from "./transaction";
import { TransactionPayload } from "./transactionPayload";


export interface ITransactionOnNetwork {
    hash: TransactionHash;
    type: string;
    nonce: Nonce;
    round: number;
    epoch: number;
    value: Balance;
    receiver: Address;
    sender: Address;
    gasPrice: GasPrice;
    gasLimit: GasLimit;
    data: TransactionPayload;
    signature: Signature;
    status: TransactionStatus;
    timestamp: number;
    blockNonce: Nonce;
    // Not available on API.
    hyperblockNonce: Nonce;
    // Not available on API.
    hyperblockHash: Hash;
    // Not available on Gateway.
    pendingResults: boolean;
    receipt: ITransactionReceipt;
    contractResults: IContractResults;
    logs: ITransactionLogs;

    isCompleted(): boolean;
    getAllEvents(): ITransactionEvent[];
}

export interface ITransactionReceipt {
    value: Balance;
    sender: Address;
    data: string;
    hash: TransactionHash;
}

export interface IContractResults {
    items: IContractResultItem[];
}

export interface IContractResultItem {
    hash: Hash;
    nonce: Nonce;
    value: Balance;
    receiver: Address;
    sender: Address;
    data: string;
    returnMessage: string;
    previousHash: Hash;
    originalHash: Hash;
    gasLimit: GasLimit;
    gasPrice: GasPrice;
    callType: number;
    logs: ITransactionLogs;
}

export interface ITransactionLogs {
    address: Address;
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
    valueOf(): Buffer;
}
