import { IAccountBalance, IAddress } from "./interface";

export interface IAccountOnNetwork {
    nonce: number;
    balance: IAccountBalance;
}

export interface INetworkConfig {
    MinGasLimit: number;
    GasPerDataByte: number;
    GasPriceModifier: number;
    ChainID: string;
}

export interface ITransactionOnNetwork {
    isCompleted?: boolean;

    hash: string;
    type: string;
    value: string;
    receiver: IAddress;
    sender: IAddress;
    data: Buffer;
    status: ITransactionStatus;
    receipt: ITransactionReceipt;
    contractResults: IContractResults;
    logs: ITransactionLogs;
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
    hash: string;
    nonce: number;
    receiver: IAddress;
    sender: IAddress;
    data: string;
    returnMessage: string;
    logs: ITransactionLogs;
}

export interface IContractQueryResponse {
    returnCode: IContractReturnCode;
    returnMessage: string;
    getReturnDataParts(): Buffer[];
}

export interface IContractReturnCode {
    toString(): string;
}

export interface ITransactionLogs {
    events: ITransactionEvent[];

    findSingleOrNoneEvent(
        identifier: string,
        predicate?: (event: ITransactionEvent) => boolean,
    ): ITransactionEvent | undefined;
}

export interface ITransactionEvent {
    readonly address: IAddress;
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
