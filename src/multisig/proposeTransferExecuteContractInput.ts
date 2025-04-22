import { Abi, BytesValue } from "../abi";
import { Address, TokenTransfer, TransactionsFactoryConfig } from "../core";
import { ARGUMENTS_SEPARATOR } from "../core/constants";
import { utf8ToHex } from "../core/utils.codec";
import { SmartContractTransactionsFactory } from "../smartContracts";

export class ProposeTransferExecuteContractInput {
    multisigContract: Address;
    to: Address;
    gasLimit?: bigint;
    functionCall: any[];

    constructor(options: { multisigContract: Address; to: Address; gasLimit?: bigint; functionCall: any[] }) {
        this.multisigContract = options.multisigContract;
        this.to = options.to;
        this.gasLimit = options.gasLimit;
        this.functionCall = options.functionCall;
    }

    static newFromTransferExecuteInput(options: {
        multisig: Address;
        to: Address;
        functionName: string;
        arguments: any[];
        optGasLimit?: bigint;
        abi?: Abi;
    }): ProposeTransferExecuteContractInput {
        const transactionsFactory = new SmartContractTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: "" }),
            abi: options.abi,
        });
        const transaction = transactionsFactory.createTransactionForExecute(Address.empty(), {
            contract: Address.empty(),
            function: options.functionName,
            gasLimit: 0n,
            arguments: options.arguments,
            nativeTransferAmount: 0n,
        });
        const functionCallParts = Buffer.from(transaction.data).toString().split(ARGUMENTS_SEPARATOR);
        const functionName = functionCallParts[0];
        const functionArguments = [];
        for (let index = 1; index < functionCallParts.length; index++) {
            const element = functionCallParts[index];
            functionArguments.push(element.valueOf());
        }
        const functionCall = [new BytesValue(Buffer.from(utf8ToHex(functionName))), ...functionArguments];
        return new ProposeTransferExecuteContractInput({
            multisigContract: options.multisig,
            to: options.to,
            functionCall: functionCall,
            gasLimit: options.optGasLimit,
        });
    }

    static newFromProposeAsyncCallInput(options: {
        multisig: Address;
        to: Address;
        tokenTransfers: TokenTransfer[];
        functionName: string;
        arguments: any[];
        optGasLimit?: bigint;
        abi?: Abi;
    }): ProposeTransferExecuteContractInput {
        const transactionsFactory = new SmartContractTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: "" }),
            abi: options.abi,
        });
        const transaction = transactionsFactory.createTransactionForExecute(Address.empty(), {
            contract: Address.empty(),
            function: options.functionName,
            gasLimit: 0n,
            arguments: options.arguments,
            nativeTransferAmount: 0n,
        });
        const functionCallParts = Buffer.from(transaction.data).toString().split(ARGUMENTS_SEPARATOR);
        const functionName = functionCallParts[0];
        const functionArguments = [];
        for (let index = 1; index < functionCallParts.length; index++) {
            const element = functionCallParts[index];
            functionArguments.push(element.valueOf());
        }
        const functionCall = [new BytesValue(Buffer.from(utf8ToHex(functionName))), ...functionArguments];
        return new ProposeTransferExecuteContractInput({
            multisigContract: options.multisig,
            to: options.to,
            functionCall: functionCall,
            gasLimit: options.optGasLimit,
        });
    }
}
