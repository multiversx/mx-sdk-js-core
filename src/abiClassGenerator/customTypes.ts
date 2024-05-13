import { Address } from "@multiversx/sdk-core";

export enum Action {
    Nothing = 0,
    AddBoardMember = 1,
    AddProposer = 2,
    RemoveUser = 3,
    ChangeQuorum = 4,
    SendTransferExecuteEgld = 5,
    SendTransferExecuteEsdt = 6,
    SendAsyncCall = 7,
    SCDeployFromSource = 8,
    SCUpgradeFromSource = 9,
}

export enum ActionStatus {
    Available = 0,
    Aborted = 1,
}

export enum UserRole {
    None = 0,
    Proposer = 1,
    BoardMember = 2,
}

export type CallActionData = {
    to: Address;
    egldAmount: bigint;
    optGasLimit?: any;
    endpointName: Uint8Array;
    arguments: any[];
};

export type EsdtTokenPayment = {
    tokenIdentifier: string;
    tokenNonce: bigint;
    amount: bigint;
};

export type EsdtTransferExecuteData = {
    to: Address;
    tokens: any[];
    optGasLimit?: any;
    endpointName: Uint8Array;
    arguments: any[];
};

export type ActionFullInfo = {
    actionId: number;
    groupId: number;
    actionData: Action;
    signers: any[];
};

export type Nothing = {
    name: "Nothing";
};

// const Nothing = "Nothing"
export type AddBoardMember = {
    0: Address;
};

export type ActionFoo = Nothing | AddBoardMember;

const a: Nothing = {};

class AAA {
    readonly 0: string;

    constructor(options: { 0: Address }) {
        this[0] = options[0];
    }
}
