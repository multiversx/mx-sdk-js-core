import { Address } from "../address";
import { Balance } from "../balance";
import { GasLimit } from "../networkParams";
import { Transaction } from "../transaction";
import { TransactionOnNetwork } from "../transactionOnNetwork";
import { Code } from "./code";
import { CodeMetadata } from "./codeMetadata";
import { ContractFunction } from "./function";
import { Interaction } from "./interaction";
import { QueryResponse } from "./queryResponse";
import { ReturnCode } from "./returnCode";
import { SmartContractResults, TypedResult } from "./smartContractResults";
import { TypedValue } from "./typesystem";

/**
 * ISmartContract defines a general interface for operating with {@link SmartContract} objects.
 */
export interface ISmartContract {
    /**
     * Gets the address of the Smart Contract.
     */
    getAddress(): Address;

    /**
     * Creates a {@link Transaction} for deploying the Smart Contract to the Network.
     */
    deploy({ code, codeMetadata, initArguments, value, gasLimit }: DeployArguments): Transaction;

    /**
     * Creates a {@link Transaction} for upgrading the Smart Contract on the Network.
     */
    upgrade({ code, codeMetadata, initArguments, value, gasLimit }: UpgradeArguments): Transaction;

    /**
     * Creates a {@link Transaction} for calling (a function of) the Smart Contract.
     */
    call({ func, args, value, gasLimit }: CallArguments): Transaction;
}

export interface IInteractionChecker {
    checkInteraction(interaction: Interaction): void;
}

export interface DeployArguments {
    code: Code;
    codeMetadata?: CodeMetadata;
    initArguments?: TypedValue[];
    value?: Balance;
    gasLimit: GasLimit;
}

export interface UpgradeArguments {
    code: Code;
    codeMetadata?: CodeMetadata;
    initArguments?: TypedValue[];
    value?: Balance;
    gasLimit: GasLimit;
}

export interface CallArguments {
    func: ContractFunction;
    args?: TypedValue[];
    value?: Balance;
    gasLimit: GasLimit;
    receiver?: Address;
}

export interface QueryArguments {
    func: ContractFunction;
    args?: TypedValue[];
    value?: Balance;
    caller?: Address
}

export interface ExecutionResultsBundle {
    transactionOnNetwork: TransactionOnNetwork;
    smartContractResults: SmartContractResults;
    immediateResult: TypedResult;
    resultingCalls: TypedResult[];
    values: TypedValue[];
    firstValue: TypedValue;
    returnCode: ReturnCode;
}

export interface QueryResponseBundle {
    queryResponse: QueryResponse;
    firstValue: TypedValue;
    values: TypedValue[];
    returnCode: ReturnCode;
}
