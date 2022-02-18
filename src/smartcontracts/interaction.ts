import { Balance } from "../balance";
import { GasLimit } from "../networkParams";
import { Transaction } from "../transaction";
import { TransactionOnNetwork } from "../transactionOnNetwork";
import { Query } from "./query";
import { QueryResponse } from "./queryResponse";
import { ContractFunction } from "./function";
import { Address } from "../address";
import { SmartContract } from "./smartContract";
import { AddressValue, BigUIntValue, BytesValue, EndpointDefinition, TypedValue, U64Value } from "./typesystem";
import { Nonce } from "../nonce";
import { ExecutionResultsBundle, QueryResponseBundle } from "./interface";
import { NetworkConfig } from "../networkConfig";
import { ESDT_TRANSFER_FUNCTION_NAME } from "../constants";

/**
 * Interactions can be seen as mutable transaction & query builders.
 * 
 * Aside from building transactions and queries, the interactors are also responsible for interpreting
 * the execution outcome for the objects they've built.
 */
export class Interaction {
    private readonly contract: SmartContract;
    private readonly executingFunction: ContractFunction;
    private readonly interpretingFunction: ContractFunction;
    private readonly args: TypedValue[];
    private readonly receiver?: Address;

    private nonce: Nonce = new Nonce(0);
    private value: Balance = Balance.Zero();
    private gasLimit: GasLimit = GasLimit.min();

    private isWithSingleESDTTransfer: boolean = false;
    private singleESDTTransferAmount: Balance = Balance.Zero();

    private isWithSingleESDTNFTTransfer: boolean = false;
    private singleESDTNFTTransferAmount: Balance = Balance.Zero();
    private singleESDTNFTTransferSender: Address = new Address();

    private isWithMultiESDTNFTTransfer: boolean = false;

    constructor(
        contract: SmartContract,
        executingFunction: ContractFunction,
        interpretingFunction: ContractFunction,
        args: TypedValue[],
        receiver?: Address,
    ) {
        this.contract = contract;
        this.executingFunction = executingFunction;
        this.interpretingFunction = interpretingFunction;
        this.args = args;
        this.receiver = receiver;
    }

    getContract(): SmartContract {
        return this.contract;
    }

    getInterpretingFunction(): ContractFunction {
        return this.interpretingFunction;
    }

    getExecutingFunction(): ContractFunction {
        return this.executingFunction;
    }

    getArguments(): TypedValue[] {
        return this.args;
    }

    getValue(): Balance {
        return this.value;
    }

    getSingleESDTTransfer(): Balance {
        return this.singleESDTTransferAmount;
    }

    getGasLimit(): GasLimit {
        return this.gasLimit;
    }

    buildTransaction(): Transaction {
        let receiver = this.receiver;
        let func: ContractFunction = this.executingFunction;
        let args = this.args;

        if (this.isWithSingleESDTTransfer) {
            func = new ContractFunction(ESDT_TRANSFER_FUNCTION_NAME);
            args = [
                // The token identifier
                BytesValue.fromUTF8(this.singleESDTTransferAmount.token.identifier),
                // The transfered amount
                new BigUIntValue(this.singleESDTTransferAmount.valueOf()),
                // The actual function to call
                BytesValue.fromUTF8(this.executingFunction.valueOf()),
                ...args
            ];
        } else if (this.isWithSingleESDTNFTTransfer) {
            // For NFT, SFT and MetaESDT, transaction.sender == transaction.receiver.
            receiver = this.singleESDTNFTTransferSender
            func = new ContractFunction("ESDTNFTTransfer");
            args = [
                // The token identifier
                // Important: for NFTs, this has to be the "collection" name, actually.
                // We will reconsider adding the field "collection" on "Token" upon merging "ApiProvider" and "ProxyProvider".
                BytesValue.fromUTF8(this.singleESDTNFTTransferAmount.token.identifier),
                // The token nonce (creation nonce)
                new U64Value(this.singleESDTNFTTransferAmount.getNonce()),
                // The transfered amount (quantity)
                // For NFTs, this will be 1.
                new BigUIntValue(this.singleESDTNFTTransferAmount.valueOf()),
                // The actual receiver of the token(s): the contract
                new AddressValue(this.contract.getAddress()),
                // The actual function to call
                BytesValue.fromUTF8(this.executingFunction.valueOf()),
                ...args
            ];
        } else if (this.isWithMultiESDTNFTTransfer) {
            func = new ContractFunction("MultiESDTNFTTransfer");

            // TBD
        }

        // TODO: create as "deploy" transaction if the function is "init" (or find a better pattern for deployments).
        let transaction = this.contract.call({
            func: func,
            // GasLimit will be set using "withGasLimit()".
            gasLimit: this.gasLimit,
            args: args,
            // Value will be set using "withValue()".
            value: this.value,
            receiver: receiver,
        });

        transaction.setNonce(this.nonce);
        return transaction;
    }

    buildQuery(): Query {
        return new Query({
            address: this.contract.getAddress(),
            func: this.executingFunction,
            args: this.args,
            // Value will be set using "withValue()".
            value: this.value,
            // Caller will be set by the InteractionRunner.
            caller: new Address()
        });
    }

    /**
     * Interprets the results of a previously broadcasted (and fully executed) smart contract transaction.
     * The outcome is structured such that it allows quick access to each level of detail.
     */
    interpretExecutionResults(transactionOnNetwork: TransactionOnNetwork): ExecutionResultsBundle {
        return interpretExecutionResults(this.getEndpoint(), transactionOnNetwork);
    }

    /**
     * Interprets the raw outcome of a Smart Contract query.
     * The outcome is structured such that it allows quick access to each level of detail.
     */
    interpretQueryResponse(queryResponse: QueryResponse): QueryResponseBundle {
        let endpoint = this.getEndpoint();
        queryResponse.setEndpointDefinition(endpoint);

        let values = queryResponse.outputTyped();
        let returnCode = queryResponse.returnCode;

        return {
            queryResponse: queryResponse,
            values: values,
            firstValue: values[0],
            returnCode: returnCode
        };
    }

    withValue(value: Balance): Interaction {
        this.value = value;
        return this;
    }

    withSingleESDTTransfer(amount: Balance): Interaction {
        this.isWithSingleESDTTransfer = true;
        this.singleESDTTransferAmount = amount;
        return this;
    }

    withSingleESDTNFTTransfer(amount: Balance, sender: Address) {
        this.isWithSingleESDTNFTTransfer = true;
        this.singleESDTNFTTransferAmount = amount;
        this.singleESDTNFTTransferSender = sender;
        return this;
    }

    withMultiESDTNFTTransfer() {
        // TBD
        this.isWithMultiESDTNFTTransfer = true;
        return this;
    }

    withGasLimit(gasLimit: GasLimit): Interaction {
        this.gasLimit = gasLimit;
        return this;
    }

    withGasLimitComponents(args: {minGasLimit?:number, gasPerDataByte?: number, estimatedExecutionComponent: number }): Interaction {
        let minGasLimit = args.minGasLimit || NetworkConfig.getDefault().MinGasLimit.valueOf();
        let gasPerDataByte = args.gasPerDataByte || NetworkConfig.getDefault().GasPerDataByte;

        let transaction = this.buildTransaction();
        let dataLength = transaction.getData().length();
        let movementComponent = new GasLimit(minGasLimit + gasPerDataByte * dataLength);
        let executionComponent = new GasLimit(args.estimatedExecutionComponent);
        let gasLimit = movementComponent.add(executionComponent);
        
        return this.withGasLimit(gasLimit);
    }
    
    withNonce(nonce: Nonce): Interaction {
        this.nonce = nonce;
        return this;
    }

    getEndpoint(): EndpointDefinition {
        return this.getContract().getAbi().getEndpoint(this.getInterpretingFunction());
    }
}

function interpretExecutionResults(endpoint: EndpointDefinition, transactionOnNetwork: TransactionOnNetwork): ExecutionResultsBundle {
    let smartContractResults = transactionOnNetwork.getSmartContractResults();
    let immediateResult = smartContractResults.getImmediate();
    let resultingCalls = smartContractResults.getResultingCalls();

    immediateResult.setEndpointDefinition(endpoint);

    let values = immediateResult.outputTyped();
    let returnCode = immediateResult.getReturnCode();

    return {
        transactionOnNetwork: transactionOnNetwork,
        smartContractResults: smartContractResults,
        immediateResult,
        resultingCalls,
        values,
        firstValue: values[0],
        returnCode: returnCode
    };
}
