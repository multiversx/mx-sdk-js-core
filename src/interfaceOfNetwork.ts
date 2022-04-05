import { IBech32Address, IHash, INonce, ITransactionPayload, ITransactionValue } from "./interface";

export interface ITransactionOnNetwork {
    hash: IHash;
    type: string;
    value: ITransactionValue;
    receiver: IBech32Address;
    sender: IBech32Address;
    data: ITransactionPayload;
    status: ITransactionStatus;
    receipt: ITransactionReceipt;
    contractResults: IContractResults;
    logs: ITransactionLogs;

    isCompleted(): boolean;
    getAllEvents(): ITransactionEvent[];
}

export interface ITransactionStatus {
    isPending(): boolean;
    isFailed(): boolean;
    isInvalid(): boolean;
    isExecuted(): boolean;
}

export interface ITransactionReceipt {
    data: string;
}

export interface IContractResults {
    items: IContractResultItem[];
}

export interface IContractResultItem {
    hash: IHash;
    nonce: INonce;
    receiver: IBech32Address;
    sender: IBech32Address;
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
    readonly address: IBech32Address;
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
