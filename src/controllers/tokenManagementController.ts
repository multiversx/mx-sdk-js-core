import { ProviderWrapper } from "../entrypoints/providerWrapper";
import { TransactionOnNetwork } from "../networkProviders";
import { INetworkProvider } from "../networkProviders/interface";
import { IESDTIssueOutcome } from "../tokenOperations";
import { Transaction } from "../transaction";
import { TransactionComputer } from "../transactionComputer";
import { TokenManagementTransactionsFactory, TransactionsFactoryConfig } from "../transactionsFactories";
import { TokenManagementTransactionsOutcomeParser } from "../transactionsOutcomeParsers";
import { TransactionWatcher } from "../transactionWatcher";
import { IAccount } from "./interfaces";

export class TokenManagementController {
    private factory: TokenManagementTransactionsFactory;
    private transactionAwaiter: TransactionWatcher;
    private txComputer: TransactionComputer;
    private parser: TokenManagementTransactionsOutcomeParser;

    constructor(options: { chainID: string; networkProvider: INetworkProvider }) {
        this.factory = new TokenManagementTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: options.chainID }),
        });
        this.transactionAwaiter = new TransactionWatcher(new ProviderWrapper(options.networkProvider));
        this.txComputer = new TransactionComputer();
        this.parser = new TokenManagementTransactionsOutcomeParser();
    }

    async createTransactionForIssuingFungible(sender: IAccount, options: IssueFungibleInput): Promise<Transaction> {
        const transaction = this.factory.createTransactionForIssuingFungible({ ...options, sender: sender.address });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedIssueFungible(txHash: string): Promise<IESDTIssueOutcome[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseIssueFungible(transaction);
    }

    parseIssueFungible(transactionOnNetwork: TransactionOnNetwork): IESDTIssueOutcome[] {
        return this.parser.parseIssueFungible(transactionOnNetwork);
    }
    async createTransactionForIssuingSemiFungible(
        sender: IAccount,
        options: IssueSemiFungibleInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForIssuingSemiFungible({
            ...options,
            sender: sender.address,
        });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedIssueSemiFungible(txHash: string): Promise<{ tokenIdentifier: string }[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseIssueSemiFungible(transaction);
    }

    parseIssueSemiFungible(transactionOnNetwork: TransactionOnNetwork): { tokenIdentifier: string }[] {
        return this.parser.parseIssueSemiFungible(transactionOnNetwork);
    }

    async createTransactionForIssuingNonFungible(
        sender: IAccount,
        options: IssueNonFungibleInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForIssuingNonFungible({ ...options, sender: sender.address });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedIssueNonFungible(txHash: string): Promise<IESDTIssueOutcome[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseIssueNonFungible(transaction);
    }
}

type IssueFungibleInput = IssueInput & {
    initialSupply: bigint;
    numDecimals: bigint;
};

type IssueSemiFungibleInput = IssueNonFungibleInput;

type IssueNonFungibleInput = IssueInput & {
    canTransferNFTCreateRole: boolean;
};

type IssueInput = {
    nonce: bigint;
    tokenName: string;
    tokenTicker: string;
    canFreeze: boolean;
    canWipe: boolean;
    canPause: boolean;
    canTransferNFTCreateRole: boolean;
    canChangeOwner: boolean;
    canUpgrade: boolean;
    canAddSpecialRoles: boolean;
};
