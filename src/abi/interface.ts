import { Address } from "../core/address";
import { Transaction } from "../core/transaction";
import { ReturnCode } from "./returnCode";
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
    deploy({ deployer, code, codeMetadata, initArguments, value, gasLimit }: DeployArguments): Transaction;

    /**
     * Creates a {@link Transaction} for upgrading the Smart Contract on the Network.
     */
    upgrade({ caller, code, codeMetadata, initArguments, value, gasLimit }: UpgradeArguments): Transaction;

    /**
     * Creates a {@link Transaction} for calling (a function of) the Smart Contract.
     */
    call({ caller, func, args, value, gasLimit }: CallArguments): Transaction;
}

export interface DeployArguments {
    code: ICode;
    codeMetadata?: ICodeMetadata;
    initArguments?: any[];
    value?: bigint;
    gasLimit: bigint;
    gasPrice?: bigint;
    chainID: string;
    deployer: Address;
}

export interface UpgradeArguments {
    code: ICode;
    codeMetadata?: ICodeMetadata;
    initArguments?: any[];
    value?: bigint;
    gasLimit: bigint;
    gasPrice?: bigint;
    chainID: string;
    caller: Address;
}

export interface CallArguments {
    func: IContractFunction;
    args?: any[];
    value?: bigint;
    gasLimit: bigint;
    receiver?: Address;
    gasPrice?: bigint;
    chainID: string;
    caller: Address;
}

export interface QueryArguments {
    func: IContractFunction;
    args?: TypedValue[];
    value?: bigint;
    caller?: Address;
}

export interface TypedOutcomeBundle {
    returnCode: ReturnCode;
    returnMessage: string;
    values: TypedValue[];
    firstValue?: TypedValue;
    secondValue?: TypedValue;
    thirdValue?: TypedValue;
    lastValue?: TypedValue;
}

export interface UntypedOutcomeBundle {
    returnCode: ReturnCode;
    returnMessage: string;
    values: Buffer[];
}

export interface ICode {
    toString(): string;
}

export interface ICodeMetadata {
    toString(): string;
}

export interface IContractFunction {
    toString(): string;
}
