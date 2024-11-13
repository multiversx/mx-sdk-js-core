import { AbiRegistry } from "../abi";
import { IAccount } from "../accounts/interfaces";
import { QueryRunnerAdapter } from "../adapters";
import { ProviderWrapper } from "../entrypoints/providerWrapper";
import { IAddress } from "../interface";
import { ITransactionOnNetwork } from "../interfaceOfNetwork";
import { INetworkProvider } from "../networkProviders/interface";
import { SmartContractQueriesController } from "../smartContractQueriesController";
import { Transaction } from "../transaction";
import { TransactionComputer } from "../transactionComputer";
import { SmartContractTransactionsFactory } from "../transactionsFactories";
import { TransactionsFactoryConfig } from "../transactionsFactoryConfig";
import { SmartContractTransactionsOutcomeParser } from "../transactionsOutcomeParsers";
import { TransactionWatcher } from "../transactionWatcher";
import { ContractDepoyInput, ContractUpgradeInput, SmartContractDeployOutcome, TransactionInput } from "./resources";

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
        this.transactionWatcher = new TransactionWatcher(new ProviderWrapper(options.networkProvider));
        this.txComputer = new TransactionComputer();
    }

    async createTransactionForDeploy(sender: IAccount, options: ContractDepoyInput): Promise<Transaction> {
        const transaction = this.factory.createTransactionForDeploy({ ...options, sender: sender.address });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedDeploy(txHash: string): Promise<SmartContractDeployOutcome> {
        const transaction = await this.transactionWatcher.awaitCompleted(txHash);
        return this.parseDeploy(transaction);
    }

    async createTransactionForUpgrade(sender: IAccount, options: ContractUpgradeInput): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUpgrade({ ...options, sender: sender.address });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForExecute(sender: IAccount, options: TransactionInput): Promise<Transaction> {
        const transaction = this.factory.createTransactionForExecute({ ...options, sender: sender.address });

        transaction.nonce = options.nonce;
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

    parseDeploy(transactionOnNetwork: ITransactionOnNetwork): SmartContractDeployOutcome {
        return this.parser.parseDeploy({ transactionOnNetwork });
    }
}
