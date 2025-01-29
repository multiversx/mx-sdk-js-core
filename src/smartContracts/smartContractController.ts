import { AbiRegistry, ArgSerializer, isTyped, NativeSerializer } from "../abi";
import { IAccount } from "../accounts/interfaces";
import { Err, ErrSmartContractQuery } from "../core/errors";
import { SmartContractQuery, SmartContractQueryInput, SmartContractQueryResponse } from "../core/smartContractQuery";
import { Transaction } from "../core/transaction";
import { TransactionComputer } from "../core/transactionComputer";
import { TransactionOnNetwork } from "../core/transactionOnNetwork";
import { TransactionsFactoryConfig } from "../core/transactionsFactoryConfig";
import { TransactionWatcher } from "../core/transactionWatcher";
import { INetworkProvider } from "../networkProviders/interface";
import { SmartContractTransactionsOutcomeParser } from "../transactionsOutcomeParsers";
import * as resources from "./resources";
import { SmartContractTransactionsFactory } from "./smartContractTransactionsFactory";

export class SmartContractController {
    private factory: SmartContractTransactionsFactory;
    private parser: SmartContractTransactionsOutcomeParser;
    private transactionWatcher: TransactionWatcher;
    private txComputer: TransactionComputer;
    private networkProvider: INetworkProvider;
    private abi?: AbiRegistry;

    constructor(options: { chainID: string; networkProvider: INetworkProvider; abi?: AbiRegistry }) {
        this.factory = new SmartContractTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: options.chainID }),
            abi: options.abi,
        });
        this.parser = new SmartContractTransactionsOutcomeParser(options);
        this.transactionWatcher = new TransactionWatcher(options.networkProvider);
        this.txComputer = new TransactionComputer();
        this.networkProvider = options.networkProvider;
        this.abi = options.abi;
    }

    async createTransactionForDeploy(
        sender: IAccount,
        nonce: bigint,
        options: resources.ContractDeployInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForDeploy(sender.address, options);

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    parseDeploy(transactionOnNetwork: TransactionOnNetwork): resources.SmartContractDeployOutcome {
        return this.parser.parseDeploy({ transactionOnNetwork });
    }

    async awaitCompletedDeploy(txHash: string): Promise<resources.SmartContractDeployOutcome> {
        const transaction = await this.transactionWatcher.awaitCompleted(txHash);
        return this.parseDeploy(transaction);
    }

    async createTransactionForUpgrade(
        sender: IAccount,
        nonce: bigint,
        options: resources.ContractUpgradeInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUpgrade(sender.address, options);

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForExecute(
        sender: IAccount,
        nonce: bigint,
        options: resources.ContractExecuteInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForExecute(sender.address, options);

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    parseExecute(transactionOnNetwork: TransactionOnNetwork): resources.ParsedSmartContractCallOutcome {
        return this.parser.parseExecute({ transactionOnNetwork });
    }

    async awaitCompletedExecute(txHash: string): Promise<resources.ParsedSmartContractCallOutcome> {
        const transaction = await this.transactionWatcher.awaitCompleted(txHash);
        return this.parseExecute(transaction);
    }

    async query(options: SmartContractQueryInput): Promise<any[]> {
        const query = this.createQuery(options);
        const queryResponse = await this.runQuery(query);
        this.raiseForStatus(queryResponse);
        return this.parseQueryResponse(queryResponse);
    }

    async runQuery(query: SmartContractQuery): Promise<SmartContractQueryResponse> {
        const queryResponse = await this.networkProvider.queryContract(query);
        return queryResponse;
    }

    createQuery(options: SmartContractQueryInput): SmartContractQuery {
        const preparedArguments = this.encodeArguments(options.function, options.arguments);

        return new SmartContractQuery({
            contract: options.contract,
            caller: options.caller,
            function: options.function,
            arguments: preparedArguments,
            value: options.value,
        });
    }

    private raiseForStatus(queryResponse: SmartContractQueryResponse): void {
        const isOk = queryResponse.returnCode === "ok";
        if (!isOk) {
            throw new ErrSmartContractQuery(queryResponse.returnCode, queryResponse.returnMessage);
        }
    }

    parseQueryResponse(response: SmartContractQueryResponse): any[] {
        if (!this.abi) {
            return response.returnDataParts;
        }

        const argsSerializer = new ArgSerializer();
        const functionName = response.function;
        const endpoint = this.abi.getEndpoint(functionName);
        const parts = response.returnDataParts.map((part) => Buffer.from(part));

        let values = argsSerializer.buffersToValues(parts, endpoint.output);

        return values.map((value) => value.valueOf());
    }

    private encodeArguments(functionName: string, args: any[]): Uint8Array[] {
        const endpoint = this.abi?.getEndpoint(functionName);

        if (endpoint) {
            const typedArgs = NativeSerializer.nativeToTypedValues(args, endpoint);
            return new ArgSerializer().valuesToBuffers(typedArgs);
        }

        if (this.areArgsOfTypedValue(args)) {
            return new ArgSerializer().valuesToBuffers(args);
        }

        if (this.areArgsBuffers(args)) {
            return args.map((arg) => Buffer.from(arg));
        }

        throw new Err(
            "cannot encode arguments: when ABI is not available, they must be either typed values or buffers",
        );
    }

    private areArgsOfTypedValue(args: any[]): boolean {
        return args.every((arg) => isTyped(arg));
    }

    private areArgsBuffers(args: any[]): boolean {
        for (const arg of args) {
            if (!ArrayBuffer.isView(arg)) {
                return false;
            }
        }

        return true;
    }
}
