import { IAccount } from "../accounts/interfaces";
import { ProviderWrapper } from "../entrypoints/providerWrapper";
import { TransactionOnNetwork } from "../networkProviders";
import { INetworkProvider } from "../networkProviders/interface";
import { IESDTIssueOutcome } from "../tokenOperations";
import { Transaction } from "../transaction";
import { TransactionComputer } from "../transactionComputer";
import { TransactionsFactoryConfig } from "../transactionsFactoryConfig";
import { TokenManagementTransactionsOutcomeParser } from "../transactionsOutcomeParsers";
import { TransactionWatcher } from "../transactionWatcher";
import * as resources from "./resources";
import { TokenManagementTransactionsFactory } from "./tokenManagementTransactionsFactory";

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

    async createTransactionForIssuingFungible(
        sender: IAccount,
        nonce: bigint,
        options: resources.IssueFungibleInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForIssuingFungible(sender.address, options);

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
        options: resources.IssueSemiFungibleInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForIssuingSemiFungible(sender.address, options);

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
        options: resources.IssueNonFungibleInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForIssuingNonFungible(sender.address, options);

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedIssueNonFungible(txHash: string): Promise<IESDTIssueOutcome[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseIssueNonFungible(transaction);
    }

    async createTransactionForRegisteringMetaEsdt(
        sender: IAccount,
        nonce: bigint,
        options: resources.RegisterMetaESDTInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForRegisteringMetaESDT(sender.address, options);

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedRegisterMetaEsdt(txHash: string): Promise<IESDTIssueOutcome[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseRegisterMetaEsdt(transaction);
    }

    async createTransactionForRegisteringAndSettingRoles(
        sender: IAccount,
        nonce: bigint,
        options: resources.RegisterRolesInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForRegisteringAndSettingRoles(sender.address, options);

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedRegisterAndSettingRoles(txHash: string): Promise<IESDTIssueOutcome[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseRegisterAndSetAllRoles(transaction);
    }

    async createTransactionForSetBurnRoleGlobally(
        sender: IAccount,
        nonce: bigint,
        options: resources.TokenIdentifierInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSettingBurnRoleGlobally(sender.address, options);

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedSetBurnRoleGlobally(txHash: string): Promise<void> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseSetBurnRoleGlobally(transaction);
    }

    async createTransactionForUnsettingBurnRoleGlobally(
        sender: IAccount,
        nonce: bigint,
        options: resources.TokenIdentifierInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnsettingBurnRoleGlobally(sender.address, options);

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedUnsetBurnRoleGlobally(txHash: string): Promise<void> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseUnsetBurnRoleGlobally(transaction);
    }

    async createTransactionForSettingSpecialRoleOnFungibleToken(
        sender: IAccount,
        nonce: bigint,
        options: resources.FungibleSpecialRoleInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSettingSpecialRoleOnFungibleToken(sender.address, options);

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedSetSpecialRoleOnFungibleToken(txHash: string): Promise<
        {
            userAddress: string;
            tokenIdentifier: string;
            roles: string[];
        }[]
    > {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseSetSpecialRole(transaction);
    }

    async createTransactionForSettingSpecialRoleOnSemiFungibleToken(
        sender: IAccount,
        nonce: bigint,
        options: resources.SemiFungibleSpecialRoleInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSettingSpecialRoleOnSemiFungibleToken(
            sender.address,
            options,
        );

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedSetSpecialRoleOnSemiFungibleToken(txHash: string): Promise<
        {
            userAddress: string;
            tokenIdentifier: string;
            roles: string[];
        }[]
    > {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseSetSpecialRole(transaction);
    }

    async createTransactionForSettingSpecialRoleOnNonFungibleToken(
        sender: IAccount,
        nonce: bigint,
        options: resources.SpecialRoleInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSettingSpecialRoleOnNonFungibleToken(
            sender.address,
            options,
        );

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedSetSpecialRoleOnNonFungibleToken(txHash: string): Promise<
        {
            userAddress: string;
            tokenIdentifier: string;
            roles: string[];
        }[]
    > {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseSetSpecialRole(transaction);
    }

    async createTransactionForCreatingNft(
        sender: IAccount,
        nonce: bigint,
        options: resources.MintInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForCreatingNFT(sender.address, options);

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedCreateNft(txHash: string): Promise<
        {
            tokenIdentifier: string;
            nonce: bigint;
            initialQuantity: bigint;
        }[]
    > {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseNftCreate(transaction);
    }

    async createTransactionForPausing(
        sender: IAccount,
        nonce: bigint,
        options: resources.ManagementInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForPausing(sender.address, options);

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedPause(txHash: string): Promise<{ tokenIdentifier: string }[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parsePause(transaction);
    }

    async createTransactionForUnpausing(
        sender: IAccount,
        nonce: bigint,
        options: resources.ManagementInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnpausing(sender.address, options);

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedUnpause(txHash: string): Promise<{ tokenIdentifier: string }[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseUnpause(transaction);
    }

    async createTransactionForFreezing(
        sender: IAccount,
        nonce: bigint,
        options: resources.ManagementInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForFreezing(sender.address, options);

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedFreeze(txHash: string): Promise<{ tokenIdentifier: string }[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseFreeze(transaction);
    }

    async createTransactionForUnFreezing(
        sender: IAccount,
        nonce: bigint,
        options: resources.ManagementInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnfreezing(sender.address, options);

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedUnfreeze(txHash: string): Promise<{ tokenIdentifier: string }[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseUnfreeze(transaction);
    }

    async createTransactionForWiping(
        sender: IAccount,
        nonce: bigint,
        options: resources.ManagementInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForWiping(sender.address, options);

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedWipe(txHash: string): Promise<{ tokenIdentifier: string }[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseWipe(transaction);
    }

    async createTransactionForLocaMinting(
        sender: IAccount,
        nonce: bigint,
        options: resources.LocalMintInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForLocalMint(sender.address, options);

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedLocalMint(txHash: string): Promise<{ tokenIdentifier: string }[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseLocalMint(transaction);
    }

    async createTransactionForLocalBurning(
        sender: IAccount,
        nonce: bigint,
        options: resources.LocalBurnInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForLocalBurning(sender.address, options);

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompleteLocalBurn(txHash: string): Promise<{ tokenIdentifier: string }[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseLocalBurn(transaction);
    }

    async createTransactionForUpdatingAttributes(
        sender: IAccount,
        nonce: bigint,
        options: resources.UpdateAttributesInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUpdatingAttributes(sender.address, options);

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedUpdateAttributes(txHash: string): Promise<{ tokenIdentifier: string }[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseUpdateAttributes(transaction);
    }

    async createTransactionForAddingQuantity(
        sender: IAccount,
        nonce: bigint,
        options: resources.UpdateQuantityInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForAddingQuantity(sender.address, options);

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedAddQuantity(txHash: string): Promise<{ tokenIdentifier: string }[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseAddQuantity(transaction);
    }

    async createTransactionForBurningQuantity(
        sender: IAccount,
        nonce: bigint,
        options: resources.UpdateQuantityInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForBurningQuantity(sender.address, options);

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedBurnQuantity(txHash: string): Promise<{ tokenIdentifier: string }[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseBurnQuantity(transaction);
    }
}
