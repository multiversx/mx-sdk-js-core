import { ProviderWrapper } from "../entrypoints/providerWrapper";
import { IAddress } from "../interface";
import { ITransactionOnNetwork } from "../interfaceOfNetwork";
import { INetworkProvider } from "../networkProviders/interface";
import { Transaction } from "../transaction";
import { TransactionComputer } from "../transactionComputer";
import {
    DelegationTransactionsFactory,
    IValidatorPublicKey,
    TransactionsFactoryConfig,
} from "../transactionsFactories";
import { DelegationTransactionsOutcomeParser } from "../transactionsOutcomeParsers";
import { TransactionWatcher } from "../transactionWatcher";
import { IAccount } from "./interfaces";

export class DelegationController {
    private transactionAwaiter: TransactionWatcher;
    private factory: DelegationTransactionsFactory;
    private parser: DelegationTransactionsOutcomeParser;
    private txComputer: TransactionComputer;

    constructor(chainId: string, networkProvider: INetworkProvider) {
        this.transactionAwaiter = new TransactionWatcher(new ProviderWrapper(networkProvider));
        this.factory = new DelegationTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: chainId }),
        });
        this.parser = new DelegationTransactionsOutcomeParser();
        this.txComputer = new TransactionComputer();
    }

    async createTransactionForNewDelegationContract(
        sender: IAccount,
        nonce: bigint,
        totalDelegationCap: bigint,
        serviceFee: bigint,
        amount: bigint,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForNewDelegationContract({
            sender: sender.address,
            totalDelegationCap,
            serviceFee,
            amount,
        });

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    parseCreateNewDelegationContract(transactionOnNetwork: ITransactionOnNetwork): { contractAddress: string }[] {
        return this.parser.parseCreateNewDelegationContract(transactionOnNetwork);
    }

    async awaitCompletedCreateNewDelegationContract(txHash: string): Promise<{ contractAddress: string }[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseCreateNewDelegationContract(transaction);
    }

    async createTransactionForAddingNodes(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
        publicKeys: IValidatorPublicKey[],
        signedMessages: Uint8Array[],
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForAddingNodes({
            sender: sender.address,
            delegationContract,
            publicKeys,
            signedMessages,
        });

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForRemovingNodes(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
        publicKeys: IValidatorPublicKey[],
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForRemovingNodes({
            sender: sender.address,
            delegationContract,
            publicKeys,
        });

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForStakingNodes(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
        publicKeys: IValidatorPublicKey[],
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForStakingNodes({
            sender: sender.address,
            delegationContract,
            publicKeys,
        });

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForUnbondingNodes(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
        publicKeys: IValidatorPublicKey[],
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnbondingNodes({
            sender: sender.address,
            delegationContract,
            publicKeys,
        });

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForUnstakingNodes(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
        publicKeys: IValidatorPublicKey[],
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnstakingNodes({
            sender: sender.address,
            delegationContract,
            publicKeys,
        });

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForUnjailingNodes(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
        publicKeys: IValidatorPublicKey[],
        amount: bigint,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnjailingNodes({
            sender: sender.address,
            delegationContract,
            publicKeys,
            amount,
        });

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForChangingServiceFee(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
        serviceFee: bigint,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForChangingServiceFee({
            sender: sender.address,
            delegationContract,
            serviceFee: serviceFee,
        });

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForModifyingDelegationCap(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
        delegationCap: bigint,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForModifyingDelegationCap({
            sender: sender.address,
            delegationContract,
            delegationCap,
        });

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForSettingAutomaticActivation(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSettingAutomaticActivation({
            sender: sender.address,
            delegationContract,
        });

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForUnsettingAutomaticActivation(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnsettingAutomaticActivation({
            sender: sender.address,
            delegationContract,
        });

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForSettingCapCheckOnRedelegateRewards(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSettingCapCheckOnRedelegateRewards({
            sender: sender.address,
            delegationContract,
        });

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForUnsettingCapCheckOnRedelegateRewards(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnsettingCapCheckOnRedelegateRewards({
            sender: sender.address,
            delegationContract,
        });

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForSettingMetadata(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
        name: string,
        website: string,
        identifier: string,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSettingMetadata({
            sender: sender.address,
            delegationContract,
            name,
            website,
            identifier,
        });

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForDelegating(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
        amount: bigint,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForDelegating({
            sender: sender.address,
            delegationContract,
            amount,
        });

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForClaimingRewards(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForClaimingRewards(sender.address, delegationContract);

        transaction.nonce = BigInt(nonce);
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForRedelegatingRewards(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForRedelegatingRewards(sender.address, delegationContract);

        transaction.nonce = BigInt(nonce);
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForUndelegating(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
        amount: bigint,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUndelegating(sender.address, delegationContract, amount);

        transaction.nonce = BigInt(nonce);
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async createTransactionForWithdrawing(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForWithdrawing(sender.address, delegationContract);

        transaction.nonce = BigInt(nonce);
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }
}
