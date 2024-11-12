import { IAccount } from "../controllers/interfaces";
import { ProviderWrapper } from "../entrypoints/providerWrapper";
import { TransactionOnNetwork } from "../networkProviders";
import { INetworkProvider } from "../networkProviders/interface";
import { IESDTIssueOutcome } from "../tokenOperations";
import { Transaction } from "../transaction";
import { TransactionComputer } from "../transactionComputer";
import { TokenManagementTransactionsFactory, TransactionsFactoryConfig } from "../transactionsFactories";
import { TokenManagementTransactionsOutcomeParser } from "../transactionsOutcomeParsers";
import { TransactionWatcher } from "../transactionWatcher";
import {
    FungibleSpecialRoleInput,
    IssueFungibleInput,
    IssueNonFungibleInput,
    IssueSemiFungibleInput,
    LocalBurnInput,
    LocalMintInput,
    ManagementInput,
    MintInput,
    RegisterMetaESDTInput,
    RegisterRolesInput,
    SemiFungibleSpecialRoleInput,
    SpecialRoleInput,
    UpdateAttributesInput,
    UpdateQuantityInput,
} from "./resources";

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

    parseIssueFungible(transactionOnNetwork: TransactionOnNetwork): IESDTIssueOutcome[] {
        return this.parser.parseIssueFungible(transactionOnNetwork);
    }

    async awaitCompletedIssueFungible(txHash: string): Promise<IESDTIssueOutcome[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseIssueFungible(transaction);
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

    parseIssueSemiFungible(transactionOnNetwork: TransactionOnNetwork): { tokenIdentifier: string }[] {
        return this.parser.parseIssueSemiFungible(transactionOnNetwork);
    }

    async awaitCompletedIssueSemiFungible(txHash: string): Promise<{ tokenIdentifier: string }[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseIssueSemiFungible(transaction);
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

    async createTransactionForRegisteringMetaEsdt(
        sender: IAccount,
        options: RegisterMetaESDTInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForRegisteringMetaESDT({
            ...options,
            sender: sender.address,
        });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedRegisterMetaEsdt(txHash: string): Promise<IESDTIssueOutcome[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseRegisterMetaEsdt(transaction);
    }

    async createTransactionForRegisteringAndSettingRoles(
        sender: IAccount,
        options: RegisterRolesInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForRegisteringAndSettingRoles({
            ...options,
            sender: sender.address,
        });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedRegisterAndSettingRoles(txHash: string): Promise<IESDTIssueOutcome[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseRegisterAndSetAllRoles(transaction);
    }

    async createTransactionForSetBurnRoleGlobally(
        sender: IAccount,
        options: { nonce: bigint; tokenIdentifier: string },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSettingBurnRoleGlobally({
            ...options,
            sender: sender.address,
        });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedSetBurnRoleGlobally(txHash: string): Promise<void> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseSetBurnRoleGlobally(transaction);
    }

    async createTransactionForUnsettingBurnRoleGlobally(
        sender: IAccount,
        options: { nonce: bigint; tokenIdentifier: string },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnsettingBurnRoleGlobally({
            ...options,
            sender: sender.address,
        });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedUnsetBurnRoleGlobally(txHash: string): Promise<void> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseUnsetBurnRoleGlobally(transaction);
    }

    async createTransactionForSettingSpecialRoleOnFungibleToken(
        sender: IAccount,
        options: FungibleSpecialRoleInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSettingSpecialRoleOnFungibleToken({
            ...options,
            sender: sender.address,
        });

        transaction.nonce = options.nonce;
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
        options: SemiFungibleSpecialRoleInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSettingSpecialRoleOnSemiFungibleToken({
            ...options,
            sender: sender.address,
        });

        transaction.nonce = options.nonce;
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
        options: SpecialRoleInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSettingSpecialRoleOnNonFungibleToken({
            ...options,
            sender: sender.address,
        });

        transaction.nonce = options.nonce;
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

    async createTransactionForCreatingNft(sender: IAccount, options: MintInput): Promise<Transaction> {
        const transaction = this.factory.createTransactionForCreatingNFT({
            ...options,
            sender: sender.address,
        });

        transaction.nonce = options.nonce;
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

    async createTransactionForPausing(sender: IAccount, options: ManagementInput): Promise<Transaction> {
        const transaction = this.factory.createTransactionForPausing({
            ...options,
            sender: sender.address,
        });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedPause(txHash: string): Promise<{ tokenIdentifier: string }[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parsePause(transaction);
    }

    async createTransactionForUnpausing(sender: IAccount, options: ManagementInput): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnpausing({
            ...options,
            sender: sender.address,
        });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedUnpause(txHash: string): Promise<{ tokenIdentifier: string }[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseUnpause(transaction);
    }

    async createTransactionForFreezing(sender: IAccount, options: ManagementInput): Promise<Transaction> {
        const transaction = this.factory.createTransactionForFreezing({
            ...options,
            sender: sender.address,
        });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedFreeze(txHash: string): Promise<{ tokenIdentifier: string }[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseFreeze(transaction);
    }

    async createTransactionForUnFreezing(sender: IAccount, options: ManagementInput): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnfreezing({
            ...options,
            sender: sender.address,
        });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedUnfreeze(txHash: string): Promise<{ tokenIdentifier: string }[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseUnfreeze(transaction);
    }

    async createTransactionForWiping(sender: IAccount, options: ManagementInput): Promise<Transaction> {
        const transaction = this.factory.createTransactionForWiping({
            ...options,
            sender: sender.address,
        });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedWipe(txHash: string): Promise<{ tokenIdentifier: string }[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseWipe(transaction);
    }

    async createTransactionForLocaMinting(sender: IAccount, options: LocalMintInput): Promise<Transaction> {
        const transaction = this.factory.createTransactionForLocalMint({
            ...options,
            sender: sender.address,
        });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedLocalMint(txHash: string): Promise<{ tokenIdentifier: string }[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseLocalMint(transaction);
    }

    async createTransactionForLocalBurning(sender: IAccount, options: LocalBurnInput): Promise<Transaction> {
        const transaction = this.factory.createTransactionForLocalBurning({
            ...options,
            sender: sender.address,
        });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompleteLocalBurn(txHash: string): Promise<{ tokenIdentifier: string }[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseLocalBurn(transaction);
    }

    async createTransactionForUpdatingAttributes(
        sender: IAccount,
        options: UpdateAttributesInput,
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUpdatingAttributes({
            ...options,
            sender: sender.address,
        });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedUpdateAttributes(txHash: string): Promise<{ tokenIdentifier: string }[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseUpdateAttributes(transaction);
    }

    async createTransactionForAddingQuantity(sender: IAccount, options: UpdateQuantityInput): Promise<Transaction> {
        const transaction = this.factory.createTransactionForAddingQuantity({
            ...options,
            sender: sender.address,
            quantityToAdd: options.quantity,
        });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedAddQuantity(txHash: string): Promise<{ tokenIdentifier: string }[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseAddQuantity(transaction);
    }

    async createTransactionForBurningQuantity(sender: IAccount, options: UpdateQuantityInput): Promise<Transaction> {
        const transaction = this.factory.createTransactionForBurningQuantity({
            ...options,
            sender: sender.address,
            quantityToBurn: options.quantity,
        });

        transaction.nonce = options.nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedBurnQuantity(txHash: string): Promise<{ tokenIdentifier: string }[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseBurnQuantity(transaction);
    }
}
