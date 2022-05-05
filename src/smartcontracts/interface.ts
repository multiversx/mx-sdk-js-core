import { IAddress, IChainID, IGasLimit, IGasPrice, ITransactionValue } from "../interface";
import { Transaction } from "../transaction";
import { ReturnCode } from "./returnCode";
import { TypedValue } from "./typesystem";

/**
 * ISmartContract defines a general interface for operating with {@link SmartContract} objects.
 */
export interface ISmartContract {
    /**
     * Gets the address of the Smart Contract.
     */
    getAddress(): IAddress;

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

export interface DeployArguments {
    code: ICode;
    codeMetadata?: ICodeMetadata;
    initArguments?: TypedValue[];
    value?: ITransactionValue;
    gasLimit: IGasLimit;
    gasPrice?: IGasPrice;
    chainID: IChainID;
}

export interface UpgradeArguments {
    code: ICode;
    codeMetadata?: ICodeMetadata;
    initArguments?: TypedValue[];
    value?: ITransactionValue;
    gasLimit: IGasLimit;
    gasPrice?: IGasPrice;
    chainID: IChainID;
}

export interface CallArguments {
    func: IContractFunction;
    args?: TypedValue[];
    value?: ITransactionValue;
    gasLimit: IGasLimit;
    receiver?: IAddress;
    gasPrice?: IGasPrice;
    chainID: IChainID;
}

export interface QueryArguments {
    func: IContractFunction;
    args?: TypedValue[];
    value?: ITransactionValue;
    caller?: IAddress
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
    name: string;
    toString(): string;
}
