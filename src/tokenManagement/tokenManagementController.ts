import { IAccount } from "../accounts/interfaces";
import { Address } from "../core";
import { Transaction } from "../core/transaction";
import { TransactionComputer } from "../core/transactionComputer";
import { TransactionOnNetwork } from "../core/transactionOnNetwork";
import { TransactionsFactoryConfig } from "../core/transactionsFactoryConfig";
import { TransactionWatcher } from "../core/transactionWatcher";
import { INetworkProvider } from "../networkProviders/interface";
import { TokenManagementTransactionsOutcomeParser } from "../transactionsOutcomeParsers";
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
        options: resources.IssueFungibleInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForIssuingFungible(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedIssueFungible(txHash: string): Promise<resources.EsdtOutput[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseIssueFungible(transaction);
    }

    parseIssueFungible(transactionOnNetwork: TransactionOnNetwork): resources.EsdtOutput[] {
        return this.parser.parseIssueFungible(transactionOnNetwork);
    }

    async createTransactionForIssuingSemiFungible(
        sender: IAccount,
        nonce: bigint,
        options: resources.IssueSemiFungibleInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForIssuingSemiFungible(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedIssueSemiFungible(txHash: string): Promise<resources.EsdtOutput[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseIssueSemiFungible(transaction);
    }

    parseIssueSemiFungible(transactionOnNetwork: TransactionOnNetwork): resources.EsdtOutput[] {
        return this.parser.parseIssueSemiFungible(transactionOnNetwork);
    }

    async createTransactionForIssuingNonFungible(
        sender: IAccount,
        nonce: bigint,
        options: resources.IssueNonFungibleInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForIssuingNonFungible(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedIssueNonFungible(txHash: string): Promise<resources.EsdtOutput[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseIssueNonFungible(transaction);
    }

    parseIssueNonFungible(transactionOnNetwork: TransactionOnNetwork): resources.EsdtOutput[] {
        return this.parser.parseIssueNonFungible(transactionOnNetwork);
    }

    async createTransactionForRegisteringMetaEsdt(
        sender: IAccount,
        nonce: bigint,
        options: resources.RegisterMetaESDTInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForRegisteringMetaESDT(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedRegisterMetaEsdt(txHash: string): Promise<resources.EsdtOutput[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseRegisterMetaEsdt(transaction);
    }

    parseRegisterMetaEsdt(transactionOnNetwork: TransactionOnNetwork): resources.EsdtOutput[] {
        return this.parser.parseRegisterMetaEsdt(transactionOnNetwork);
    }

    async createTransactionForRegisteringAndSettingRoles(
        sender: IAccount,
        nonce: bigint,
        options: resources.RegisterRolesInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForRegisteringAndSettingRoles(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedRegisterAndSettingRoles(txHash: string): Promise<resources.EsdtOutput[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseRegisterAndSetAllRoles(transaction);
    }

    parseRegisterAndSetAllRoles(transactionOnNetwork: TransactionOnNetwork): resources.EsdtOutput[] {
        return this.parser.parseRegisterMetaEsdt(transactionOnNetwork);
    }

    async createTransactionForSetBurnRoleGlobally(
        sender: IAccount,
        nonce: bigint,
        options: resources.BurnRoleGloballyInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSettingBurnRoleGlobally(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
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
        options: resources.BurnRoleGloballyInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnsettingBurnRoleGlobally(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
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
        options: resources.FungibleSpecialRoleInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSettingSpecialRoleOnFungibleToken(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
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
        options: resources.SemiFungibleSpecialRoleInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSettingSpecialRoleOnSemiFungibleToken(
            sender.address,
            options,
        );

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
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
        options: resources.SpecialRoleInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSettingSpecialRoleOnNonFungibleToken(
            sender.address,
            options,
        );

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
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
        options: resources.MintInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForCreatingNFT(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
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
        options: resources.PausingInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForPausing(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedPause(txHash: string): Promise<resources.EsdtOutput[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parsePause(transaction);
    }

    parsePause(transactionOnNetwork: TransactionOnNetwork): resources.EsdtOutput[] {
        return this.parser.parsePause(transactionOnNetwork);
    }

    async createTransactionForUnpausing(
        sender: IAccount,
        nonce: bigint,
        options: resources.PausingInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnpausing(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedUnpause(txHash: string): Promise<resources.EsdtOutput[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseUnpause(transaction);
    }

    parseUnpause(transactionOnNetwork: TransactionOnNetwork): resources.EsdtOutput[] {
        return this.parser.parseUnpause(transactionOnNetwork);
    }

    async createTransactionForFreezing(
        sender: IAccount,
        nonce: bigint,
        options: resources.ManagementInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForFreezing(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedFreeze(txHash: string): Promise<resources.EsdtOutput[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseFreeze(transaction);
    }

    parseFreeze(transactionOnNetwork: TransactionOnNetwork): resources.EsdtOutput[] {
        return this.parser.parseFreeze(transactionOnNetwork);
    }

    async createTransactionForUnFreezing(
        sender: IAccount,
        nonce: bigint,
        options: resources.ManagementInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUnfreezing(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedUnfreeze(txHash: string): Promise<resources.EsdtOutput[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseUnfreeze(transaction);
    }

    parseUnfreeze(transactionOnNetwork: TransactionOnNetwork): resources.EsdtOutput[] {
        return this.parser.parseUnfreeze(transactionOnNetwork);
    }

    async createTransactionForWiping(
        sender: IAccount,
        nonce: bigint,
        options: resources.ManagementInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForWiping(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedWipe(txHash: string): Promise<resources.EsdtOutput[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parser.parseWipe(transaction);
    }

    parseWipe(transactionOnNetwork: TransactionOnNetwork): resources.EsdtOutput[] {
        return this.parser.parseWipe(transactionOnNetwork);
    }

    async createTransactionForLocaMinting(
        sender: IAccount,
        nonce: bigint,
        options: resources.LocalMintInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForLocalMint(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedLocalMint(txHash: string): Promise<resources.EsdtOutput[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseLocalMint(transaction);
    }

    parseLocalMint(transactionOnNetwork: TransactionOnNetwork): resources.EsdtOutput[] {
        return this.parser.parseLocalMint(transactionOnNetwork);
    }

    async createTransactionForLocalBurning(
        sender: IAccount,
        nonce: bigint,
        options: resources.LocalBurnInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForLocalBurning(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompleteLocalBurn(txHash: string): Promise<resources.EsdtOutput[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseLocalBurn(transaction);
    }

    parseLocalBurn(transactionOnNetwork: TransactionOnNetwork): resources.EsdtOutput[] {
        return this.parser.parseLocalBurn(transactionOnNetwork);
    }

    async createTransactionForUpdatingAttributes(
        sender: IAccount,
        nonce: bigint,
        options: resources.UpdateAttributesInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUpdatingAttributes(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedUpdateAttributes(txHash: string): Promise<resources.EsdtOutput[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseUpdateAttributes(transaction);
    }

    parseUpdateAttributes(transactionOnNetwork: TransactionOnNetwork): resources.EsdtOutput[] {
        return this.parser.parseUpdateAttributes(transactionOnNetwork);
    }

    async createTransactionForAddingQuantity(
        sender: IAccount,
        nonce: bigint,
        options: resources.UpdateQuantityInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForAddingQuantity(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedAddQuantity(txHash: string): Promise<resources.EsdtOutput[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseAddQuantity(transaction);
    }

    parseAddQuantity(transactionOnNetwork: TransactionOnNetwork): resources.EsdtOutput[] {
        return this.parser.parseAddQuantity(transactionOnNetwork);
    }

    async createTransactionForBurningQuantity(
        sender: IAccount,
        nonce: bigint,
        options: resources.UpdateQuantityInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForBurningQuantity(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedBurnQuantity(txHash: string): Promise<resources.EsdtOutput[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseBurnQuantity(transaction);
    }

    parseBurnQuantity(transactionOnNetwork: TransactionOnNetwork): resources.EsdtOutput[] {
        return this.parser.parseBurnQuantity(transactionOnNetwork);
    }

    async createTransactionForModifyingRoyalties(
        sender: IAccount,
        nonce: bigint,
        options: resources.ModifyRoyaltiesInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForModifyingRoyalties(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedModifyRoyalties(txHash: string): Promise<resources.EsdtOutput[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseModifyRoyalties(transaction);
    }

    parseModifyRoyalties(transactionOnNetwork: TransactionOnNetwork): resources.EsdtOutput[] {
        return this.parser.parseModifyRoyalties(transactionOnNetwork);
    }

    async createTransactionForSettingNewUris(
        sender: IAccount,
        nonce: bigint,
        options: resources.SetNewUriInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForSettingNewUris(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedSetNewUris(txHash: string): Promise<resources.EsdtOutput[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseSetNewUris(transaction);
    }

    parseSetNewUris(transactionOnNetwork: TransactionOnNetwork): resources.EsdtOutput[] {
        return this.parser.parseSetNewUris(transactionOnNetwork);
    }

    async createTransactionForModifyingCreator(
        sender: IAccount,
        nonce: bigint,
        options: resources.SetNewUriInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForModifyingCreator(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedModifyCreator(txHash: string): Promise<resources.ModifyingCreatorOutput[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseModifyCreator(transaction);
    }

    parseModifyCreator(transactionOnNetwork: TransactionOnNetwork): resources.ModifyingCreatorOutput[] {
        return this.parser.parseModifyCreator(transactionOnNetwork);
    }

    async createTransactionForUpdatingMetadata(
        sender: IAccount,
        nonce: bigint,
        options: resources.SetNewUriInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForModifyingCreator(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedUpdateMetadata(txHash: string): Promise<resources.EsdtOutput[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseUpdateMetadata(transaction);
    }

    parseUpdateMetadata(transactionOnNetwork: TransactionOnNetwork): resources.EsdtOutput[] {
        return this.parser.parseUpdateMetadata(transactionOnNetwork);
    }

    async createTransactionForMetadataRecreate(
        sender: IAccount,
        nonce: bigint,
        options: resources.SetNewUriInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForMetadataRecreate(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedMetadataRecreate(txHash: string): Promise<resources.EsdtOutput[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseMetadataRecreate(transaction);
    }

    parseMetadataRecreate(transactionOnNetwork: TransactionOnNetwork): resources.EsdtOutput[] {
        return this.parser.parseMetadataRecreate(transactionOnNetwork);
    }

    async createTransactionForChangingTokenToDynamic(
        sender: IAccount,
        nonce: bigint,
        options: resources.SetNewUriInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForChangingTokenToDynamic(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedChangeTokenToDynamic(txHash: string): Promise<resources.ChangeToDynamicOutput[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseChangeTokenToDynamic(transaction);
    }

    parseChangeTokenToDynamic(transactionOnNetwork: TransactionOnNetwork): resources.ChangeToDynamicOutput[] {
        return this.parser.parseChangeTokenToDynamic(transactionOnNetwork);
    }

    async createTransactionForUpdatingTokenId(
        sender: IAccount,
        nonce: bigint,
        options: resources.UpdateTokenIDInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForUpdatingTokenId(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedUpdateTokenId(txHash: string): Promise<TransactionOnNetwork> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return transaction;
    }

    async createTransactionForRegisteringDynamicToken(
        sender: IAccount,
        nonce: bigint,
        options: resources.RegisteringDynamicTokenInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForRegisteringDynamicToken(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedRegisterDynamicToken(txHash: string): Promise<resources.EsdtOutput[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseRegisterDynamicToken(transaction);
    }

    parseRegisterDynamicToken(transactionOnNetwork: TransactionOnNetwork): resources.RegisterDynamicOutput[] {
        return this.parser.parseRegisterDynamicToken(transactionOnNetwork);
    }

    async createTransactionForRegisteringDynamicTokenAndSettingRoles(
        sender: IAccount,
        nonce: bigint,
        options: resources.RegisteringDynamicTokenInput & { guardian?: Address; relayer?: Address },
    ): Promise<Transaction> {
        const transaction = this.factory.createTransactionForRegisteringDynamicAndSettingRoles(sender.address, options);

        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        transaction.signature = await sender.sign(this.txComputer.computeBytesForSigning(transaction));

        return transaction;
    }

    async awaitCompletedRegisterDynamicTokenAndSettingRoles(txHash: string): Promise<resources.EsdtOutput[]> {
        const transaction = await this.transactionAwaiter.awaitCompleted(txHash);
        return this.parseRegisterDynamicTokenAndSettingRoles(transaction);
    }

    parseRegisterDynamicTokenAndSettingRoles(
        transactionOnNetwork: TransactionOnNetwork,
    ): resources.RegisterDynamicOutput[] {
        return this.parser.parseRegisterDynamicTokenAndSettingRoles(transactionOnNetwork);
    }
}
