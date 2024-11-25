import { AbiRegistry } from "../abi";
import { IAccount } from "../accounts/interfaces";
import { QueryRunnerAdapter } from "../adapters";
import { IAddress } from "../interface";
import { INetworkProvider } from "../networkProviders/interface";
import { SmartContractQueriesController } from "../smartContractQueriesController";
import { Transaction } from "../transaction";
import { TransactionComputer } from "../transactionComputer";
import { TransactionOnNetwork } from "../transactionOnNetwork";
import { TransactionsFactoryConfig } from "../transactionsFactoryConfig";
import { SmartContractTransactionsOutcomeParser } from "../transactionsOutcomeParsers";
import { TransactionWatcher } from "../transactionWatcher";
import * as resources from "./resources";
import { SmartContractTransactionsFactory } from "./smartContractTransactionsFactory";

export class SmartContractController {
    private factory: SmartContractTransactionsFactory;
    private parser: SmartContractTransactionsOutcomeParser;
    private queryController: SmartContractQueriesController;
    private transactionWatcher: TransactionWatcher;
    private txComputer: TransactionComputer;

    constructor(options: { chainID: string; networkProvider: INetworkProvider; abi?: AbiRegistry }) {
        this.factory = new SmartContractTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: options.chainID }),
            abi: options.abi,
        });
        this.parser = new SmartContractTransactionsOutcomeParser(options);

        this.queryController = new SmartContractQueriesController({
            queryRunner: new QueryRunnerAdapter(options),
            abi: options.abi,
        });
        this.transactionWatcher = new TransactionWatcher(options.networkProvider);
        this.txComputer = new TransactionComputer();
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

    queryContract(contract: IAddress, func: string, args: any[], caller?: IAddress, value?: bigint): Promise<any[]> {
        return this.queryController.query({
            contract: contract.bech32(),
            function: func,
            arguments: args,
            caller: caller ? caller.bech32() : undefined,
            value: BigInt(value ?? 0),
        });
    }

    parseDeploy(transactionOnNetwork: TransactionOnNetwork): resources.SmartContractDeployOutcome {
        return this.parser.parseDeploy({ transactionOnNetwork });
    }
}
