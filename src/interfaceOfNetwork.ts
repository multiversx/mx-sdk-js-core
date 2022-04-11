import { IAccountBalance, IAddress, IChainID, IGasLimit, IHash, INonce, ITransactionPayload, ITransactionValue } from "./interface";

export interface IAccountOnNetwork {
    nonce: INonce;
    balance: IAccountBalance;
}

export interface INetworkConfig {
    MinGasLimit: IGasLimit;
    GasPerDataByte: number;
    GasPriceModifier: number;
    ChainID: IChainID;
}

export interface ITransactionOnNetwork {
    isCompleted: boolean;
    
    hash: IHash;
    type: string;
    value: ITransactionValue;
    receiver: IAddress;
    sender: IAddress;
    data: ITransactionPayload;
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
    hash: IHash;
    nonce: INonce;
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

    findSingleOrNoneEvent(identifier: string, predicate?: (event: ITransactionEvent) => boolean): ITransactionEvent | undefined;
    findFirstOrNoneEvent(identifier: string, predicate?: (event: ITransactionEvent) => boolean): ITransactionEvent | undefined;
    findEvents(identifier: string, predicate?: (event: ITransactionEvent) => boolean): ITransactionEvent[];
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
