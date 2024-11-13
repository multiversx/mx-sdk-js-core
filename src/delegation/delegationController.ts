import { IAccount } from "../accounts/interfaces";
import { ProviderWrapper } from "../entrypoints/providerWrapper";
import { ITransactionOnNetwork } from "../interfaceOfNetwork";
import { INetworkProvider } from "../networkProviders/interface";
import { Transaction } from "../transaction";
import { TransactionComputer } from "../transactionComputer";
import { TransactionsFactoryConfig } from "../transactionsFactories";
import { DelegationTransactionsOutcomeParser } from "../transactionsOutcomeParsers";
import { TransactionWatcher } from "../transactionWatcher";
import { DelegationTransactionsFactory } from "./delegationTransactionsFactory";
import {
    AddNodesInput,
    ChangeServiceFee,
    DelegateActionsInput,
    ManageDelegationContractInput,
    ManageNodesInput,
    ModifyDelegationCapInput,
    NewDelegationContractInput,
    SetContractMetadataInput,
    UnjailingNodesInput,
} from "./resources";

export class DelegationController {
    private transactionAwaiter: TransactionWatcher;
    private factory: DelegationTransactionsFactory;
    private parser: DelegationTransactionsOutcomeParser;
    private txComputer: TransactionComputer;

    constructor(options: { chainID: string; networkProvider: INetworkProvider }) {
        this.transactionAwaiter = new TransactionWatcher(new ProviderWrapper(options.networkProvider));
        this.factory = new DelegationTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: options.chainID }),
        });
        this.parser = new DelegationTransactionsOutcomeParser();
        this.txComputer = new TransactionComputer();
    }

    async createTransactionForNewDelegationContract(
        sender: IAccount,
        options: NewDelegationContractInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForNewDelegationContract({
            ...options,
            sender: sender.address,
        });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedCreateNewDelegationContract(txHash: string): Promise<{ contractAddress: string }[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseCreateNewDelegationContract(transaction);
    }

    parseCreateNewDelegationContract(transactionOnNetwork: ITransactionOnNetwork): { contractAddress: string }[] {
        return this.parser.parseCreateNewDelegationContract(transactionOnNetwork);
    }

    async createTransactionForAddingNodes(sender: IAccount, options: AddNodesInput): Promise<Transaction> {
        const transaction = this.factory.createTransactionForAddingNodes({ ...options, sender: sender.address });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForRemovingNodes(sender: IAccount, options: ManageNodesInput): Promise<Transaction> {
        const transaction = this.factory.createTransactionForRemovingNodes({ ...options, sender: sender.address });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForStakingNodes(sender: IAccount, options: ManageNodesInput): Promise<Transaction> {
        const transaction = this.factory.createTransactionForStakingNodes({ ...options, sender: sender.address });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForUnbondingNodes(sender: IAccount, options: ManageNodesInput): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnbondingNodes({ ...options, sender: sender.address });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForUnstakingNodes(sender: IAccount, options: ManageNodesInput): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnstakingNodes({ ...options, sender: sender.address });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForUnjailingNodes(sender: IAccount, options: UnjailingNodesInput): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnjailingNodes({ ...options, sender: sender.address });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForChangingServiceFee(sender: IAccount, options: ChangeServiceFee): Promise<Transaction> {
        const transaction = this.factory.createTransactionForChangingServiceFee({ ...options, sender: sender.address });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForModifyingDelegationCap(
        sender: IAccount,
        options: ModifyDelegationCapInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForModifyingDelegationCap({
            ...options,
            sender: sender.address,
        });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForSettingAutomaticActivation(
        sender: IAccount,
        options: ManageDelegationContractInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSettingAutomaticActivation({
            ...options,
            sender: sender.address,
        });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForUnsettingAutomaticActivation(
        sender: IAccount,
        options: ManageDelegationContractInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnsettingAutomaticActivation({
            ...options,
            sender: sender.address,
        });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForSettingCapCheckOnRedelegateRewards(
        sender: IAccount,
        options: ManageDelegationContractInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSettingCapCheckOnRedelegateRewards({
            ...options,
            sender: sender.address,
        });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForUnsettingCapCheckOnRedelegateRewards(
        sender: IAccount,
        options: ManageDelegationContractInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnsettingCapCheckOnRedelegateRewards({
            ...options,
            sender: sender.address,
        });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForSettingMetadata(
        sender: IAccount,
        options: SetContractMetadataInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSettingMetadata({
            ...options,
            sender: sender.address,
        });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForDelegating(sender: IAccount, options: DelegateActionsInput): Promise<Transaction> {
        const transaction = this.factory.createTransactionForDelegating({ ...options, sender: sender.address });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForClaimingRewards(
        sender: IAccount,
        options: ManageDelegationContractInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForClaimingRewards({ ...options, sender: sender.address });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForRedelegatingRewards(
        sender: IAccount,
        options: ManageDelegationContractInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForRedelegatingRewards({
            ...options,
            sender: sender.address,
        });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForUndelegating(sender: IAccount, options: DelegateActionsInput): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUndelegating({ ...options, sender: sender.address });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForWithdrawing(
        sender: IAccount,
        options: ManageDelegationContractInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForWithdrawing({ ...options, sender: sender.address });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }
}
