import { ProviderWrapper } from "../facades/providerWrapper";
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

    createTransactionForNewDelegationContract(
        sender: IAccount,
        nonce: bigint,
        totalDelegationCap: bigint,
        serviceFee: bigint,
        amount: bigint,
    ): Transaction {
        const transaction = this.factory.createTransactionForNewDelegationContract({
            sender: sender.address,
            totalDelegationCap,
            serviceFee,
            amount,
        });

        transaction.nonce = nonce;
        transaction.signature = sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    parseCreateNewDelegationContract(transactionOnNetwork: ITransactionOnNetwork): { contractAddress: string }[] {
        return this.parser.parseCreateNewDelegationContract(transactionOnNetwork);
    }

    async awaitCompletedCreateNewDelegationContract(txHash: string): Promise<{ contractAddress: string }[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseCreateNewDelegationContract(transaction);
    }

    createTransactionForAddingNodes(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
        publicKeys: IValidatorPublicKey[],
        signedMessages: Uint8Array[],
    ): Transaction {
        const transaction = this.factory.createTransactionForAddingNodes({
            sender: sender.address,
            delegationContract,
            publicKeys,
            signedMessages,
        });

        transaction.nonce = nonce;
        transaction.signature = sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    createTransactionForRemovingNodes(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
        publicKeys: IValidatorPublicKey[],
    ): Transaction {
        const transaction = this.factory.createTransactionForRemovingNodes({
            sender: sender.address,
            delegationContract,
            publicKeys,
        });

        transaction.nonce = nonce;
        transaction.signature = sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    createTransactionForStakingNodes(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
        publicKeys: IValidatorPublicKey[],
    ): Transaction {
        const transaction = this.factory.createTransactionForStakingNodes({
            sender: sender.address,
            delegationContract,
            publicKeys,
        });

        transaction.nonce = nonce;
        transaction.signature = sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    createTransactionForUnbondingNodes(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
        publicKeys: IValidatorPublicKey[],
    ): Transaction {
        const transaction = this.factory.createTransactionForUnbondingNodes({
            sender: sender.address,
            delegationContract,
            publicKeys,
        });

        transaction.nonce = nonce;
        transaction.signature = sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    createTransactionForUnstakingNodes(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
        publicKeys: IValidatorPublicKey[],
    ): Transaction {
        const transaction = this.factory.createTransactionForUnstakingNodes({
            sender: sender.address,
            delegationContract,
            publicKeys,
        });

        transaction.nonce = nonce;
        transaction.signature = sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    createTransactionForUnjailingNodes(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
        publicKeys: IValidatorPublicKey[],
        amount: bigint,
    ): Transaction {
        const transaction = this.factory.createTransactionForUnjailingNodes({
            sender: sender.address,
            delegationContract,
            publicKeys,
            amount,
        });

        transaction.nonce = nonce;
        transaction.signature = sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    createTransactionForChangingServiceFee(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
        serviceFee: bigint,
    ): Transaction {
        const transaction = this.factory.createTransactionForChangingServiceFee({
            sender: sender.address,
            delegationContract,
            serviceFee: serviceFee,
        });

        transaction.nonce = nonce;
        transaction.signature = sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    createTransactionForModifyingDelegationCap(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
        delegationCap: bigint,
    ): Transaction {
        const transaction = this.factory.createTransactionForModifyingDelegationCap({
            sender: sender.address,
            delegationContract,
            delegationCap,
        });

        transaction.nonce = nonce;
        transaction.signature = sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    createTransactionForSettingAutomaticActivation(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
    ): Transaction {
        const transaction = this.factory.createTransactionForSettingAutomaticActivation({
            sender: sender.address,
            delegationContract,
        });

        transaction.nonce = nonce;
        transaction.signature = sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    createTransactionForUnsettingAutomaticActivation(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
    ): Transaction {
        const transaction = this.factory.createTransactionForUnsettingAutomaticActivation({
            sender: sender.address,
            delegationContract,
        });

        transaction.nonce = nonce;
        transaction.signature = sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    createTransactionForSettingCapCheckOnRedelegateRewards(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
    ): Transaction {
        const transaction = this.factory.createTransactionForSettingCapCheckOnRedelegateRewards({
            sender: sender.address,
            delegationContract,
        });

        transaction.nonce = nonce;
        transaction.signature = sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    createTransactionForUnsettingCapCheckOnRedelegateRewards(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
    ): Transaction {
        const transaction = this.factory.createTransactionForUnsettingCapCheckOnRedelegateRewards({
            sender: sender.address,
            delegationContract,
        });

        transaction.nonce = nonce;
        transaction.signature = sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    createTransactionForSettingMetadata(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
        name: string,
        website: string,
        identifier: string,
    ): Transaction {
        const transaction = this.factory.createTransactionForSettingMetadata({
            sender: sender.address,
            delegationContract,
            name,
            website,
            identifier,
        });

        transaction.nonce = nonce;
        transaction.signature = sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    createTransactionForDelegating(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
        amount: bigint,
    ): Transaction {
        const transaction = this.factory.createTransactionForDelegating({
            sender: sender.address,
            delegationContract,
            amount,
        });

        transaction.nonce = nonce;
        transaction.signature = sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    createTransactionForClaimingRewards(sender: IAccount, nonce: bigint, delegationContract: IAddress): Transaction {
        const transaction = this.factory.createTransactionForClaimingRewards(sender.address, delegationContract);

        transaction.nonce = BigInt(nonce);
        transaction.signature = sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    createTransactionForRedelegatingRewards(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
    ): Transaction {
        const transaction = this.factory.createTransactionForRedelegatingRewards(sender.address, delegationContract);

        transaction.nonce = BigInt(nonce);
        transaction.signature = sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    createTransactionForUndelegating(
        sender: IAccount,
        nonce: bigint,
        delegationContract: IAddress,
        amount: bigint,
    ): Transaction {
        const transaction = this.factory.createTransactionForUndelegating(sender.address, delegationContract, amount);

        transaction.nonce = BigInt(nonce);
        transaction.signature = sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    createTransactionForWithdrawing(sender: IAccount, nonce: bigint, delegationContract: IAddress): Transaction {
        const transaction = this.factory.createTransactionForWithdrawing(sender.address, delegationContract);

        transaction.nonce = BigInt(nonce);
        transaction.signature = sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }
}
