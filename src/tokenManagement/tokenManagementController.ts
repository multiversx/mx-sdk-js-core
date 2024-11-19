import { IAccount } from "../accounts/interfaces";
import { INetworkProvider } from "../networkProviders/interface";
import { IESDTIssueOutcome } from "../tokenOperations";
import { Transaction } from "../transaction";
import { TransactionComputer } from "../transactionComputer";
import { TransactionOnNetwork } from "../transactions";
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
        this.transactionAwaiter = new TransactionWatcher(options.networkProvider);
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

    async awaitCompletedIssueFungible(txHash: string): Promise<IESDTIssueOutcome[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseIssueFungible(transaction);
    }

    parseIssueFungible(transactionOnNetwork: TransactionOnNetwork): IESDTIssueOutcome[] {
        return this.parser.parseIssueFungible(transactionOnNetwork);
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

    async awaitCompletedIssueSemiFungible(txHash: string): Promise<{ tokenIdentifier: string }[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseIssueSemiFungible(transaction);
    }

    parseIssueSemiFungible(transactionOnNetwork: TransactionOnNetwork): { tokenIdentifier: string }[] {
        return this.parser.parseIssueSemiFungible(transactionOnNetwork);
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
        return this.parseIssueNonFungible(transaction);
    }

    parseIssueNonFungible(transactionOnNetwork: TransactionOnNetwork): { tokenIdentifier: string }[] {
        return this.parser.parseIssueNonFungible(transactionOnNetwork);
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
        return this.parseRegisterMetaEsdt(transaction);
    }

    parseRegisterMetaEsdt(transactionOnNetwork: TransactionOnNetwork): IESDTIssueOutcome[] {
        return this.parser.parseRegisterMetaEsdt(transactionOnNetwork);
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
        return this.parseRegisterAndSetAllRoles(transaction);
    }

    parseRegisterAndSetAllRoles(transactionOnNetwork: TransactionOnNetwork): IESDTIssueOutcome[] {
        return this.parser.parseRegisterMetaEsdt(transactionOnNetwork);
    }

    async createTransactionForSetBurnRoleGlobally(
        sender: IAccount,
        nonce: bigint,
        options: resources.BurnRoleGloballyInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSettingBurnRoleGlobally(sender.address, options);

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedSetBurnRoleGlobally(txHash: string): Promise<void> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseSetBurnRoleGlobally(transaction);
    }

    parseSetBurnRoleGlobally(transactionOnNetwork: TransactionOnNetwork): void {
        return this.parser.parseSetBurnRoleGlobally(transactionOnNetwork);
    }

    async createTransactionForUnsettingBurnRoleGlobally(
        sender: IAccount,
        nonce: bigint,
        options: resources.BurnRoleGloballyInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnsettingBurnRoleGlobally(sender.address, options);

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedUnsetBurnRoleGlobally(txHash: string): Promise<void> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseUnsetBurnRoleGlobally(transaction);
    }

    parseUnsetBurnRoleGlobally(transactionOnNetwork: TransactionOnNetwork): void {
        return this.parser.parseUnsetBurnRoleGlobally(transactionOnNetwork);
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

    async awaitCompletedSetSpecialRoleOnFungibleToken(txHash: string): Promise<resources.SpecialRoleOutput[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseSetSpecialRoleOnFungible(transaction);
    }

    parseSetSpecialRoleOnFungible(transactionOnNetwork: TransactionOnNetwork): resources.SpecialRoleOutput[] {
        return this.parser.parseSetSpecialRole(transactionOnNetwork);
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

    async awaitCompletedSetSpecialRoleOnSemiFungibleToken(txHash: string): Promise<resources.SpecialRoleOutput[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseSetSpecialRoleOnSemiFungibleToken(transaction);
    }

    parseSetSpecialRoleOnSemiFungibleToken(transactionOnNetwork: TransactionOnNetwork): resources.SpecialRoleOutput[] {
        return this.parser.parseSetSpecialRole(transactionOnNetwork);
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

    async awaitCompletedSetSpecialRoleOnNonFungibleToken(txHash: string): Promise<resources.SpecialRoleOutput[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseSetSpecialRoleOnNonFungibleToken(transaction);
    }

    parseSetSpecialRoleOnNonFungibleToken(transactionOnNetwork: TransactionOnNetwork): resources.SpecialRoleOutput[] {
        return this.parser.parseSetSpecialRole(transactionOnNetwork);
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

    async awaitCompletedCreateNft(txHash: string): Promise<resources.MintNftOutput[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseNftCreate(transaction);
    }

    parseNftCreate(transactionOnNetwork: TransactionOnNetwork): resources.MintNftOutput[] {
        return this.parser.parseNftCreate(transactionOnNetwork);
    }

    async createTransactionForPausing(
        sender: IAccount,
        nonce: bigint,
        options: resources.PausingInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForPausing(sender.address, options);

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedPause(txHash: string): Promise<{ tokenIdentifier: string }[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parsePause(transaction);
    }

    parsePause(transactionOnNetwork: TransactionOnNetwork): { tokenIdentifier: string }[] {
        return this.parser.parsePause(transactionOnNetwork);
    }

    async createTransactionForUnpausing(
        sender: IAccount,
        nonce: bigint,
        options: resources.PausingInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnpausing(sender.address, options);

        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedUnpause(txHash: string): Promise<{ tokenIdentifier: string }[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseUnpause(transaction);
    }

    parseUnpause(transactionOnNetwork: TransactionOnNetwork): { tokenIdentifier: string }[] {
        return this.parser.parseUnpause(transactionOnNetwork);
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
        return this.parseFreeze(transaction);
    }

    parseFreeze(transactionOnNetwork: TransactionOnNetwork): { tokenIdentifier: string }[] {
        return this.parser.parseFreeze(transactionOnNetwork);
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
        return this.parseUnfreeze(transaction);
    }

    parseUnfreeze(transactionOnNetwork: TransactionOnNetwork): { tokenIdentifier: string }[] {
        return this.parser.parseUnfreeze(transactionOnNetwork);
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

    parseWipe(transactionOnNetwork: TransactionOnNetwork): { tokenIdentifier: string }[] {
        return this.parser.parseWipe(transactionOnNetwork);
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
        return this.parseLocalMint(transaction);
    }

    parseLocalMint(transactionOnNetwork: TransactionOnNetwork): { tokenIdentifier: string }[] {
        return this.parser.parseLocalMint(transactionOnNetwork);
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
        return this.parseLocalBurn(transaction);
    }

    parseLocalBurn(transactionOnNetwork: TransactionOnNetwork): { tokenIdentifier: string }[] {
        return this.parser.parseLocalBurn(transactionOnNetwork);
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
        return this.parseUpdateAttributes(transaction);
    }

    parseUpdateAttributes(transactionOnNetwork: TransactionOnNetwork): { tokenIdentifier: string }[] {
        return this.parser.parseUpdateAttributes(transactionOnNetwork);
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
        return this.parseAddQuantity(transaction);
    }

    parseAddQuantity(transactionOnNetwork: TransactionOnNetwork): { tokenIdentifier: string }[] {
        return this.parser.parseAddQuantity(transactionOnNetwork);
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
        return this.parseBurnQuantity(transaction);
    }

    parseBurnQuantity(transactionOnNetwork: TransactionOnNetwork): { tokenIdentifier: string }[] {
        return this.parser.parseBurnQuantity(transactionOnNetwork);
    }
}
