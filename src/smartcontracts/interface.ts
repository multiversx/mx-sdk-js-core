import { Balance } from "../balance";
import { IBech32Address, IChainID, IGasLimit, IGasPrice } from "../interface";
import { IContractQueryResponse, ITransactionOnNetwork } from "../interfaceOfNetwork";
import { Transaction } from "../transaction";
import { Code } from "./code";
import { CodeMetadata } from "./codeMetadata";
import { ContractFunction } from "./function";
import { ReturnCode } from "./returnCode";
import { EndpointDefinition, TypedValue } from "./typesystem";

/**
 * ISmartContract defines a general interface for operating with {@link SmartContract} objects.
 */
export interface ISmartContract {
    /**
     * Gets the address of the Smart Contract.
     */
    getAddress(): IBech32Address;

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
    code: Code;
    codeMetadata?: CodeMetadata;
    initArguments?: TypedValue[];
    value?: Balance;
    gasLimit: IGasLimit;
    gasPrice?: IGasPrice;
    chainID: IChainID;
}

export interface UpgradeArguments {
    code: Code;
    codeMetadata?: CodeMetadata;
    initArguments?: TypedValue[];
    value?: Balance;
    gasLimit: IGasLimit;
    gasPrice?: IGasPrice;
    chainID: IChainID;
}

export interface CallArguments {
    func: ContractFunction;
    args?: TypedValue[];
    value?: Balance;
    gasLimit: IGasLimit;
    receiver?: IBech32Address;
    gasPrice?: IGasPrice;
    chainID: IChainID;
}

export interface QueryArguments {
    func: ContractFunction;
    args?: TypedValue[];
    value?: Balance;
    caller?: IBech32Address
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

export interface IResultsParser {
    parseQueryResponse(queryResponse: IContractQueryResponse, endpoint: EndpointDefinition): TypedOutcomeBundle;
    parseUntypedQueryResponse(queryResponse: IContractQueryResponse): UntypedOutcomeBundle;

    parseOutcome(transaction: ITransactionOnNetwork, endpoint: EndpointDefinition): TypedOutcomeBundle;
    parseUntypedOutcome(transaction: ITransactionOnNetwork): UntypedOutcomeBundle;
}
