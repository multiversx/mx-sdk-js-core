import { IAddress, INonce } from "../interface";

export interface ITransactionEvent {
    readonly address: IAddress;
    readonly identifier: string;
    readonly topics: ITransactionEventTopic[];
    readonly data: string;
}

export interface ITransactionEventTopic { valueOf(): Buffer; }

export interface IOutcomeBundle<TOutcome> {
    outcome?: TOutcome;
    error?: IOutcomeError;

    isSuccess(): boolean;
    raiseOnError(): void;
}

export interface IOutcomeError {
    event: string;
    data: string;
    message: string;
}

export interface IESDTIssueOutcome {
    tokenIdentifier: string;
}

export interface ISetSpecialRoleOutcome {
    userAddress: IAddress;
    tokenIdentifier: string;
    roles: string[];
}

export interface IMintOutcome {
    userAddress: IAddress;
    tokenIdentifier: string;
    nonce: INonce;
    mintedSupply: string;
}

export interface IBurnOutcome {
    userAddress: IAddress;
    tokenIdentifier: string;
    nonce: INonce;
    burntSupply: string;
}

export interface IPausingOutcome {
    tokenIdentifier: string;
    paused: boolean;
}

export interface IFreezingOutcome {
    userAddress: IAddress;
    tokenIdentifier: string;
    nonce: INonce;
    balance: string;
}

export interface IEmptyOutcome {
}
