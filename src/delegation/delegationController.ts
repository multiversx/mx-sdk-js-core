import { IAccount } from "../accounts/interfaces";
import { Address } from "../core";
import { Transaction } from "../core/transaction";
import { TransactionComputer } from "../core/transactionComputer";
import { TransactionOnNetwork } from "../core/transactionOnNetwork";
import { TransactionsFactoryConfig } from "../core/transactionsFactoryConfig";
import { TransactionWatcher } from "../core/transactionWatcher";
import { INetworkProvider } from "../networkProviders/interface";
import { DelegationTransactionsFactory } from "./delegationTransactionsFactory";
import { DelegationTransactionsOutcomeParser } from "./delegationTransactionsOutcomeParser";
import * as resources from "./resources";

export class DelegationController {
    private transactionAwaiter: TransactionWatcher;
    private factory: DelegationTransactionsFactory;
    private parser: DelegationTransactionsOutcomeParser;
    private txComputer: TransactionComputer;

    constructor(options: { chainID: string; networkProvider: INetworkProvider }) {
        this.transactionAwaiter = new TransactionWatcher(options.networkProvider);
        this.factory = new DelegationTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: options.chainID }),
        });
        this.parser = new DelegationTransactionsOutcomeParser();
        this.txComputer = new TransactionComputer();
    }

    async createTransactionForNewDelegationContract(
        sender: IAccount,
        nonce: bigint,
        options: resources.NewDelegationContractInput,
        guardian: Address = Address.empty(),
        relayer: Address = Address.empty()
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForNewDelegationContract(sender.address, options);

        transaction.guardian = guardian;
        transaction.relayer = relayer;
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

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
        options: resources.AddNodesInput,
        guardian: Address = Address.empty(),
        relayer: Address = Address.empty()
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForAddingNodes(sender.address, options);

        transaction.guardian = guardian;
        transaction.relayer = relayer;
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForRemovingNodes(
        sender: IAccount,
        nonce: bigint,
        options: resources.ManageNodesInput,
        guardian: Address = Address.empty(),
        relayer: Address = Address.empty()
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForRemovingNodes(sender.address, options);

        transaction.guardian = guardian;
        transaction.relayer = relayer;
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForStakingNodes(
        sender: IAccount,
        nonce: bigint,
        options: resources.ManageNodesInput,
        guardian: Address = Address.empty(),
        relayer: Address = Address.empty()
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForStakingNodes(sender.address, options);

        transaction.guardian = guardian;
        transaction.relayer = relayer;
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForUnbondingNodes(
        sender: IAccount,
        nonce: bigint,
        options: resources.ManageNodesInput,
        guardian: Address = Address.empty(),
        relayer: Address = Address.empty()
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnbondingNodes(sender.address, options);

        transaction.guardian = guardian;
        transaction.relayer = relayer;
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForUnstakingNodes(
        sender: IAccount,
        nonce: bigint,
        options: resources.ManageNodesInput,
        guardian: Address = Address.empty(),
        relayer: Address = Address.empty()
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnstakingNodes(sender.address, options);

        transaction.guardian = guardian;
        transaction.relayer = relayer;
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForUnjailingNodes(
        sender: IAccount,
        nonce: bigint,
        options: resources.UnjailingNodesInput,
        guardian: Address = Address.empty(),
        relayer: Address = Address.empty()
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnjailingNodes(sender.address, options);

        transaction.guardian = guardian;
        transaction.relayer = relayer;
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForChangingServiceFee(
        sender: IAccount,
        nonce: bigint,
        options: resources.ChangeServiceFee,
        guardian: Address = Address.empty(),
        relayer: Address = Address.empty()
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForChangingServiceFee(sender.address, options);

        transaction.guardian = guardian;
        transaction.relayer = relayer;
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForModifyingDelegationCap(
        sender: IAccount,
        nonce: bigint,
        options: resources.ModifyDelegationCapInput,
        guardian: Address = Address.empty(),
        relayer: Address = Address.empty()
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForModifyingDelegationCap(sender.address, options);

        transaction.guardian = guardian;
        transaction.relayer = relayer;
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForSettingAutomaticActivation(
        sender: IAccount,
        nonce: bigint,
        options: resources.ManageDelegationContractInput,
        guardian: Address = Address.empty(),
        relayer: Address = Address.empty()
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSettingAutomaticActivation(sender.address, options);

        transaction.guardian = guardian;
        transaction.relayer = relayer;
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForUnsettingAutomaticActivation(
        sender: IAccount,
        nonce: bigint,
        options: resources.ManageDelegationContractInput,
        guardian: Address = Address.empty(),
        relayer: Address = Address.empty()
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnsettingAutomaticActivation(sender.address, options);

        transaction.guardian = guardian;
        transaction.relayer = relayer;
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForSettingCapCheckOnRedelegateRewards(
        sender: IAccount,
        nonce: bigint,
        options: resources.ManageDelegationContractInput,
        guardian: Address = Address.empty(),
        relayer: Address = Address.empty()
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSettingCapCheckOnRedelegateRewards(
            sender.address,
            options,
        );

        transaction.guardian = guardian;
        transaction.relayer = relayer;
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForUnsettingCapCheckOnRedelegateRewards(
        sender: IAccount,
        nonce: bigint,
        options: resources.ManageDelegationContractInput,
        guardian: Address = Address.empty(),
        relayer: Address = Address.empty()
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnsettingCapCheckOnRedelegateRewards(
            sender.address,
            options,
        );

        transaction.guardian = guardian;
        transaction.relayer = relayer;
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForSettingMetadata(
        sender: IAccount,
        nonce: bigint,
        options: resources.SetContractMetadataInput,
        guardian: Address = Address.empty(),
        relayer: Address = Address.empty()
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSettingMetadata(sender.address, options);

        transaction.guardian = guardian;
        transaction.relayer = relayer;
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForDelegating(
        sender: IAccount,
        nonce: bigint,
        options: resources.DelegateActionsInput,
        guardian: Address = Address.empty(),
        relayer: Address = Address.empty()
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForDelegating(sender.address, options);

        transaction.guardian = guardian;
        transaction.relayer = relayer;
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForClaimingRewards(
        sender: IAccount,
        nonce: bigint,
        options: resources.ManageDelegationContractInput,
        guardian: Address = Address.empty(),
        relayer: Address = Address.empty()

    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForClaimingRewards(sender.address, options);

        transaction.guardian = guardian;
        transaction.relayer = relayer;
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForRedelegatingRewards(
        sender: IAccount,
        nonce: bigint,
        options: resources.ManageDelegationContractInput,
        guardian: Address = Address.empty(),
        relayer: Address = Address.empty()
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForRedelegatingRewards(sender.address, options);

        transaction.guardian = guardian;
        transaction.relayer = relayer;
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForUndelegating(
        sender: IAccount,
        nonce: bigint,
        options: resources.DelegateActionsInput,
        guardian: Address = Address.empty(),
        relayer: Address = Address.empty()
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUndelegating(sender.address, options);

        transaction.guardian = guardian;
        transaction.relayer = relayer;
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForWithdrawing(
        sender: IAccount,
        nonce: bigint,
        options: resources.ManageDelegationContractInput,
        guardian: Address = Address.empty(),
        relayer: Address = Address.empty()
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForWithdrawing(sender.address, options);

        transaction.nonce = nonce;
        transaction.guardian = guardian;
        transaction.relayer = relayer;

        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }
}
