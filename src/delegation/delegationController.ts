import {
    Address,
    BaseController,
    BaseControllerInput,
    IAccount,
    Transaction,
    TransactionOnNetwork,
    TransactionsFactoryConfig,
    TransactionWatcher,
} from "../core";
import { INetworkProvider } from "../networkProviders/interface";
import { DelegationTransactionsFactory } from "./delegationTransactionsFactory";
import { DelegationTransactionsOutcomeParser } from "./delegationTransactionsOutcomeParser";
import * as resources from "./resources";

export class DelegationController extends BaseController {
    private transactionAwaiter: TransactionWatcher;
    private factory: DelegationTransactionsFactory;
    private parser: DelegationTransactionsOutcomeParser;

    constructor(options: { chainID: string; networkProvider: INetworkProvider }) {
        super();
        this.transactionAwaiter = new TransactionWatcher(options.networkProvider);
        this.factory = new DelegationTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: options.chainID }),
        });
        this.parser = new DelegationTransactionsOutcomeParser();
    }

    async createTransactionForNewDelegationContract(
        sender: IAccount,
        nonce: bigint,
        options: resources.NewDelegationContractInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForNewDelegationContract(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    async awaitCompletedCreateNewDelegationContract(txHash: string): Promise<{ contractAddress: string }[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseCreateNewDelegationContract(transaction);
    }

    parseCreateNewDelegationContract(transactionOnNetwork: TransactionOnNetwork): { contractAddress: string }[] {
        return this.parser.parseCreateNewDelegationContract(transactionOnNetwork);
    }

    async createTransactionForAddingNodes(
        sender: IAccount,
        nonce: bigint,
        options: resources.AddNodesInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForAddingNodes(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    async createTransactionForRemovingNodes(
        sender: IAccount,
        nonce: bigint,
        options: resources.ManageNodesInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForRemovingNodes(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    async createTransactionForStakingNodes(
        sender: IAccount,
        nonce: bigint,
        options: resources.ManageNodesInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForStakingNodes(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    async createTransactionForUnbondingNodes(
        sender: IAccount,
        nonce: bigint,
        options: resources.ManageNodesInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnbondingNodes(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    async createTransactionForUnstakingNodes(
        sender: IAccount,
        nonce: bigint,
        options: resources.ManageNodesInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnstakingNodes(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    async createTransactionForUnjailingNodes(
        sender: IAccount,
        nonce: bigint,
        options: resources.UnjailingNodesInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnjailingNodes(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    async createTransactionForChangingServiceFee(
        sender: IAccount,
        nonce: bigint,
        options: resources.ChangeServiceFee & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForChangingServiceFee(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    async createTransactionForModifyingDelegationCap(
        sender: IAccount,
        nonce: bigint,
        options: resources.ModifyDelegationCapInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForModifyingDelegationCap(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    async createTransactionForSettingAutomaticActivation(
        sender: IAccount,
        nonce: bigint,
        options: resources.ManageDelegationContractInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSettingAutomaticActivation(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    async createTransactionForUnsettingAutomaticActivation(
        sender: IAccount,
        nonce: bigint,
        options: resources.ManageDelegationContractInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnsettingAutomaticActivation(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    async createTransactionForSettingCapCheckOnRedelegateRewards(
        sender: IAccount,
        nonce: bigint,
        options: resources.ManageDelegationContractInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSettingCapCheckOnRedelegateRewards(
            sender.address,
            options,
        );

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    async createTransactionForUnsettingCapCheckOnRedelegateRewards(
        sender: IAccount,
        nonce: bigint,
        options: resources.ManageDelegationContractInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnsettingCapCheckOnRedelegateRewards(
            sender.address,
            options,
        );

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    async createTransactionForSettingMetadata(
        sender: IAccount,
        nonce: bigint,
        options: resources.SetContractMetadataInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSettingMetadata(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    async createTransactionForDelegating(
        sender: IAccount,
        nonce: bigint,
        options: resources.DelegateActionsInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForDelegating(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    async createTransactionForClaimingRewards(
        sender: IAccount,
        nonce: bigint,
        options: resources.ManageDelegationContractInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForClaimingRewards(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    async createTransactionForRedelegatingRewards(
        sender: IAccount,
        nonce: bigint,
        options: resources.ManageDelegationContractInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForRedelegatingRewards(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    async createTransactionForUndelegating(
        sender: IAccount,
        nonce: bigint,
        options: resources.DelegateActionsInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUndelegating(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }

    async createTransactionForWithdrawing(
        sender: IAccount,
        nonce: bigint,
        options: resources.ManageDelegationContractInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForWithdrawing(sender.address, options);

        transaction.nonce = nonce;
        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();

        this.setTransactionGasOptions(transaction, options);
        transaction.signature = await sender.signTransaction(transaction);

        return transaction;
    }
}
