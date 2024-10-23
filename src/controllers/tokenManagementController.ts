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

    constructor(chainId: string, networkProvider: INetworkProvider) {
        this.factory = new TokenManagementTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: chainId }),
        });
        this.transactionAwaiter = new TransactionWatcher(new ProviderWrapper(networkProvider));
        this.txComputer = new TransactionComputer();
        this.parser = new TokenManagementTransactionsOutcomeParser();
    }

    async createTransactionForIssuingFungible(
        sender: IAccount,
        nonce: bigint,
        tokenName: string,
        tokenTicker: string,
        initialSupply: bigint,
        numDecimals: bigint,
        canFreeze: boolean,
        canWipe: boolean,
        canPause: boolean,
        canChangeOwner: boolean,
        canUpgrade: boolean,
        canAddSpecialRoles: boolean,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForIssuingFungible({
            sender: sender.address,
            tokenName,
            tokenTicker,
            initialSupply,
            numDecimals,
            canFreeze,
            canWipe,
            canPause,
            canChangeOwner,
            canUpgrade,
            canAddSpecialRoles,
        });

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    parseIssueFungible(transactionOnNetwork: TransactionOnNetwork): IESDTIssueOutcome[] {
        return this.parser.parseIssueFungible(transactionOnNetwork);
    }

    async awaitCompletedIssueFungible(txHash: string): Promise<IESDTIssueOutcome[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseIssueFungible(transaction);
    }

    async createTransactionForIssuingSemiFungible(
        sender: IAccount,
        nonce: bigint,
        tokenName: string,
        tokenTicker: string,
        canFreeze: boolean,
        canWipe: boolean,
        canPause: boolean,
        canTransferNftCreateRole: boolean,
        canChangeOwner: boolean,
        canUpgrade: boolean,
        canAddSpecialRoles: boolean,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForIssuingSemiFungible({
            sender: sender.address,
            tokenName,
            tokenTicker,
            canFreeze,
            canWipe,
            canPause,
            canTransferNFTCreateRole: canTransferNftCreateRole,
            canChangeOwner,
            canUpgrade,
            canAddSpecialRoles,
        });

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    parseIssueSemiFungible(transactionOnNetwork: TransactionOnNetwork): { tokenIdentifier: string }[] {
        return this.parser.parseIssueSemiFungible(transactionOnNetwork);
    }

    async awaitCompletedIssueSemiFungible(txHash: string): Promise<{ tokenIdentifier: string }[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseIssueSemiFungible(transaction);
    }

    async createTransactionForIssuingNonFungible(
        sender: IAccount,
        nonce: bigint,
        tokenName: string,
        tokenTicker: string,
        canFreeze: boolean,
        canWipe: boolean,
        canPause: boolean,
        canTransferNFTCreateRole: boolean,
        canChangeOwner: boolean,
        canUpgrade: boolean,
        canAddSpecialRoles: boolean,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForIssuingNonFungible({
            sender: sender.address,
            tokenName,
            tokenTicker,
            canFreeze,
            canWipe,
            canPause,
            canTransferNFTCreateRole,
            canChangeOwner,
            canUpgrade,
            canAddSpecialRoles,
        });

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedIssueNonFungible(txHash: string): Promise<IESDTIssueOutcome[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseIssueNonFungible(transaction);
    }
}
