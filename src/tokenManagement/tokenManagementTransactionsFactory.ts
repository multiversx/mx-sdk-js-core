import { AddressValue, ArgSerializer, BigUIntValue, BytesValue, StringValue } from "../abi";
import { IGasLimitEstimator } from "../core";
import { Address } from "../core/address";
import { BaseFactory } from "../core/baseFactory";
import { ESDT_CONTRACT_ADDRESS_HEX } from "../core/constants";
import { ErrBadUsage } from "../core/errors";
import { Logger } from "../core/logger";
import { Transaction } from "../core/transaction";
import * as resources from "./resources";

interface IConfig {
    chainID: string;
    addressHrp: string;
    minGasLimit: bigint;
    gasLimitPerByte: bigint;
    gasLimitIssue: bigint;
    gasLimitToggleBurnRoleGlobally: bigint;
    gasLimitEsdtLocalMint: bigint;
    gasLimitEsdtLocalBurn: bigint;
    gasLimitSetSpecialRole: bigint;
    gasLimitPausing: bigint;
    gasLimitFreezing: bigint;
    gasLimitWiping: bigint;
    gasLimitEsdtNftCreate: bigint;
    gasLimitEsdtNftUpdateAttributes: bigint;
    gasLimitEsdtNftAddQuantity: bigint;
    gasLimitEsdtNftBurn: bigint;
    gasLimitStorePerByte: bigint;
    gasLimitEsdtModifyRoyalties: bigint;
    gasLimitEsdtModifyCreator: bigint;
    gasLimitEsdtMetadataUpdate: bigint;
    gasLimitSetNewUris: bigint;
    gasLimitNftMetadataRecreate: bigint;
    gasLimitNftChangeToDynamic: bigint;
    gasLimitUpdateTokenId: bigint;
    gasLimitRegisterDynamic: bigint;
    issueCost: bigint;
}

/**
 * Use this class to create token management transactions like issuing ESDTs, creating NFTs, setting roles, etc.
 */
export class TokenManagementTransactionsFactory extends BaseFactory {
    private readonly config: IConfig;
    private readonly argSerializer: ArgSerializer;
    private readonly trueAsString: string;
    private readonly falseAsString: string;
    private readonly esdtContractAddress: Address;

    constructor(options: { config: IConfig; gasLimitEstimator?: IGasLimitEstimator }) {
        super({ config: options.config, gasLimitEstimator: options.gasLimitEstimator });
        this.config = options.config;
        this.argSerializer = new ArgSerializer();
        this.trueAsString = "true";
        this.falseAsString = "false";
        this.esdtContractAddress = Address.newFromHex(ESDT_CONTRACT_ADDRESS_HEX, this.config.addressHrp);
    }

    async createTransactionForIssuingFungible(
        sender: Address,
        options: resources.IssueFungibleInput,
    ): Promise<Transaction> {
        this.notifyAboutUnsettingBurnRoleGlobally();

        const args = [
            new StringValue(options.tokenName),
            new StringValue(options.tokenTicker),
            new BigUIntValue(options.initialSupply),
            new BigUIntValue(options.numDecimals),
            new StringValue("canFreeze"),
            new StringValue(this.boolToString(options.canFreeze)),
            new StringValue("canWipe"),
            new StringValue(this.boolToString(options.canWipe)),
            new StringValue("canPause"),
            new StringValue(this.boolToString(options.canPause)),
            new StringValue("canChangeOwner"),
            new StringValue(this.boolToString(options.canChangeOwner)),
            new StringValue("canUpgrade"),
            new StringValue(this.boolToString(options.canUpgrade)),
            new StringValue("canAddSpecialRoles"),
            new StringValue(this.boolToString(options.canAddSpecialRoles)),
        ];

        const dataParts = ["issue", ...this.argSerializer.valuesToStrings(args)];

        const transaction = new Transaction({
            sender: sender,
            receiver: this.esdtContractAddress,
            chainID: this.config.chainID,
            gasLimit: 0n,
            value: this.config.issueCost,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitIssue);

        return transaction;
    }

    async createTransactionForIssuingSemiFungible(
        sender: Address,
        options: resources.IssueSemiFungibleInput,
    ): Promise<Transaction> {
        this.notifyAboutUnsettingBurnRoleGlobally();

        const args = [
            new StringValue(options.tokenName),
            new StringValue(options.tokenTicker),
            new StringValue("canFreeze"),
            new StringValue(this.boolToString(options.canFreeze)),
            new StringValue("canWipe"),
            new StringValue(this.boolToString(options.canWipe)),
            new StringValue("canPause"),
            new StringValue(this.boolToString(options.canPause)),
            new StringValue("canTransferNFTCreateRole"),
            new StringValue(this.boolToString(options.canTransferNFTCreateRole)),
            new StringValue("canChangeOwner"),
            new StringValue(this.boolToString(options.canChangeOwner)),
            new StringValue("canUpgrade"),
            new StringValue(this.boolToString(options.canUpgrade)),
            new StringValue("canAddSpecialRoles"),
            new StringValue(this.boolToString(options.canAddSpecialRoles)),
        ];

        const dataParts = ["issueSemiFungible", ...this.argSerializer.valuesToStrings(args)];

        const transaction = new Transaction({
            sender: sender,
            receiver: this.esdtContractAddress,
            chainID: this.config.chainID,
            gasLimit: 0n,
            value: this.config.issueCost,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitIssue);

        return transaction;
    }

    async createTransactionForIssuingNonFungible(
        sender: Address,
        options: resources.IssueNonFungibleInput,
    ): Promise<Transaction> {
        this.notifyAboutUnsettingBurnRoleGlobally();

        const args = [
            new StringValue(options.tokenName),
            new StringValue(options.tokenTicker),
            new StringValue("canFreeze"),
            new StringValue(this.boolToString(options.canFreeze)),
            new StringValue("canWipe"),
            new StringValue(this.boolToString(options.canWipe)),
            new StringValue("canPause"),
            new StringValue(this.boolToString(options.canPause)),
            new StringValue("canTransferNFTCreateRole"),
            new StringValue(this.boolToString(options.canTransferNFTCreateRole)),
            new StringValue("canChangeOwner"),
            new StringValue(this.boolToString(options.canChangeOwner)),
            new StringValue("canUpgrade"),
            new StringValue(this.boolToString(options.canUpgrade)),
            new StringValue("canAddSpecialRoles"),
            new StringValue(this.boolToString(options.canAddSpecialRoles)),
        ];

        const dataParts = ["issueNonFungible", ...this.argSerializer.valuesToStrings(args)];

        const transaction = new Transaction({
            sender: sender,
            receiver: this.esdtContractAddress,
            chainID: this.config.chainID,
            gasLimit: 0n,
            value: this.config.issueCost,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitIssue);

        return transaction;
    }

    async createTransactionForRegisteringMetaESDT(
        sender: Address,
        options: resources.RegisterMetaESDTInput,
    ): Promise<Transaction> {
        this.notifyAboutUnsettingBurnRoleGlobally();

        const args = [
            new StringValue(options.tokenName),
            new StringValue(options.tokenTicker),
            new BigUIntValue(options.numDecimals),
            new StringValue("canFreeze"),
            new StringValue(this.boolToString(options.canFreeze)),
            new StringValue("canWipe"),
            new StringValue(this.boolToString(options.canWipe)),
            new StringValue("canPause"),
            new StringValue(this.boolToString(options.canPause)),
            new StringValue("canTransferNFTCreateRole"),
            new StringValue(this.boolToString(options.canTransferNFTCreateRole)),
            new StringValue("canChangeOwner"),
            new StringValue(this.boolToString(options.canChangeOwner)),
            new StringValue("canUpgrade"),
            new StringValue(this.boolToString(options.canUpgrade)),
            new StringValue("canAddSpecialRoles"),
            new StringValue(this.boolToString(options.canAddSpecialRoles)),
        ];

        const dataParts = ["registerMetaESDT", ...this.argSerializer.valuesToStrings(args)];

        const transaction = new Transaction({
            sender: sender,
            receiver: this.esdtContractAddress,
            chainID: this.config.chainID,
            gasLimit: 0n,
            value: this.config.issueCost,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitIssue);

        return transaction;
    }

    async createTransactionForRegisteringAndSettingRoles(
        sender: Address,
        options: resources.RegisterRolesInput,
    ): Promise<Transaction> {
        this.notifyAboutUnsettingBurnRoleGlobally();

        const dataParts = [
            "registerAndSetAllRoles",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenName),
                new StringValue(options.tokenTicker),
                new StringValue(options.tokenType),
                new BigUIntValue(options.numDecimals),
            ]),
        ];

        const transaction = new Transaction({
            sender: sender,
            receiver: this.esdtContractAddress,
            chainID: this.config.chainID,
            gasLimit: 0n,
            value: this.config.issueCost,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitIssue);

        return transaction;
    }

    async createTransactionForSettingBurnRoleGlobally(
        sender: Address,
        options: resources.BurnRoleGloballyInput,
    ): Promise<Transaction> {
        const dataParts = [
            "setBurnRoleGlobally",
            ...this.argSerializer.valuesToStrings([new StringValue(options.tokenIdentifier)]),
        ];

        const transaction = new Transaction({
            sender: sender,
            receiver: this.esdtContractAddress,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitToggleBurnRoleGlobally);

        return transaction;
    }

    async createTransactionForUnsettingBurnRoleGlobally(
        sender: Address,
        options: resources.BurnRoleGloballyInput,
    ): Promise<Transaction> {
        const dataParts = [
            "unsetBurnRoleGlobally",
            ...this.argSerializer.valuesToStrings([new StringValue(options.tokenIdentifier)]),
        ];

        const transaction = new Transaction({
            sender: sender,
            receiver: this.esdtContractAddress,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitToggleBurnRoleGlobally);

        return transaction;
    }

    async createTransactionForSettingSpecialRoleOnFungibleToken(
        sender: Address,
        options: resources.FungibleSpecialRoleInput,
    ): Promise<Transaction> {
        const args = [new StringValue(options.tokenIdentifier), new AddressValue(options.user)];

        options.addRoleLocalMint ? args.push(new StringValue("ESDTRoleLocalMint")) : 0;
        options.addRoleLocalBurn ? args.push(new StringValue("ESDTRoleLocalBurn")) : 0;
        options.addRoleESDTTransferRole ? args.push(new StringValue("ESDTTransferRole")) : 0;

        const dataParts = ["setSpecialRole", ...this.argSerializer.valuesToStrings(args)];

        const transaction = new Transaction({
            sender: sender,
            receiver: this.esdtContractAddress,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitSetSpecialRole);

        return transaction;
    }

    async createTransactionForUnsettingSpecialRoleOnFungibleToken(
        sender: Address,
        options: resources.UnsetFungibleSpecialRoleInput,
    ): Promise<Transaction> {
        const args = [new StringValue(options.tokenIdentifier), new AddressValue(options.user)];

        options.removeRoleLocalMint ? args.push(new StringValue("ESDTRoleLocalMint")) : 0;
        options.removeRoleESDTTransferRole ? args.push(new StringValue("ESDTRoleLocalBurn")) : 0;
        options.removeRoleESDTTransferRole ? args.push(new StringValue("ESDTTransferRole")) : 0;

        const dataParts = ["unSetSpecialRole", ...this.argSerializer.valuesToStrings(args)];

        const transaction = new Transaction({
            sender: sender,
            receiver: this.esdtContractAddress,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitSetSpecialRole);

        return transaction;
    }

    async createTransactionForSettingSpecialRoleOnSemiFungibleToken(
        sender: Address,
        options: resources.SemiFungibleSpecialRoleInput,
    ): Promise<Transaction> {
        const args = [new StringValue(options.tokenIdentifier), new AddressValue(options.user)];

        options.addRoleNFTCreate ? args.push(new StringValue("ESDTRoleNFTCreate")) : 0;
        options.addRoleNFTBurn ? args.push(new StringValue("ESDTRoleNFTBurn")) : 0;
        options.addRoleNFTAddQuantity ? args.push(new StringValue("ESDTRoleNFTAddQuantity")) : 0;
        options.addRoleESDTTransferRole ? args.push(new StringValue("ESDTTransferRole")) : 0;
        options.addRoleNFTUpdate ? args.push(new StringValue("ESDTRoleNFTUpdate")) : 0;
        options.addRoleESDTModifyRoyalties ? args.push(new StringValue("ESDTRoleModifyRoyalties")) : 0;
        options.addRoleESDTSetNewUri ? args.push(new StringValue("ESDTRoleSetNewURI")) : 0;
        options.addRoleESDTModifyCreator ? args.push(new StringValue("ESDTRoleModifyCreator")) : 0;
        options.addRoleNFTRecreate ? args.push(new StringValue("ESDTRoleNFTRecreate")) : 0;

        const dataParts = ["setSpecialRole", ...this.argSerializer.valuesToStrings(args)];

        const transaction = new Transaction({
            sender: sender,
            receiver: this.esdtContractAddress,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitSetSpecialRole);

        return transaction;
    }

    async createTransactionForUnsettingSpecialRoleOnSemiFungibleToken(
        sender: Address,
        options: resources.UnsetSemiFungibleSpecialRoleInput,
    ): Promise<Transaction> {
        const args = [new StringValue(options.tokenIdentifier), new AddressValue(options.user)];

        options.removeRoleNFTBurn ? args.push(new StringValue("ESDTRoleNFTBurn")) : 0;
        options.removeRoleNFTAddQuantity ? args.push(new StringValue("ESDTRoleNFTAddQuantity")) : 0;
        options.removeRoleESDTTransferRole ? args.push(new StringValue("ESDTTransferRole")) : 0;
        options.removeRoleNFTUpdate ? args.push(new StringValue("ESDTRoleNFTUpdate")) : 0;
        options.removeRoleESDTModifyRoyalties ? args.push(new StringValue("ESDTRoleModifyRoyalties")) : 0;
        options.removeRoleESDTSetNewUri ? args.push(new StringValue("ESDTRoleSetNewURI")) : 0;
        options.removeRoleESDTModifyCreator ? args.push(new StringValue("ESDTRoleModifyCreator")) : 0;
        options.removeRoleNFTRecreate ? args.push(new StringValue("ESDTRoleNFTRecreate")) : 0;

        const dataParts = ["unSetSpecialRole", ...this.argSerializer.valuesToStrings(args)];

        const transaction = new Transaction({
            sender: sender,
            receiver: this.esdtContractAddress,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitSetSpecialRole);

        return transaction;
    }

    async createTransactionForSettingSpecialRoleOnMetaESDT(
        sender: Address,
        options: resources.SemiFungibleSpecialRoleInput,
    ): Promise<Transaction> {
        return await this.createTransactionForSettingSpecialRoleOnSemiFungibleToken(sender, options);
    }

    async createTransactionForUnsettingSpecialRoleOnMetaESDT(
        sender: Address,
        options: resources.UnsetSemiFungibleSpecialRoleInput,
    ): Promise<Transaction> {
        return await this.createTransactionForUnsettingSpecialRoleOnSemiFungibleToken(sender, options);
    }

    async createTransactionForSettingSpecialRoleOnNonFungibleToken(
        sender: Address,
        options: resources.SpecialRoleInput,
    ): Promise<Transaction> {
        const args = [new StringValue(options.tokenIdentifier), new AddressValue(options.user)];

        options.addRoleNFTCreate ? args.push(new StringValue("ESDTRoleNFTCreate")) : 0;
        options.addRoleNFTBurn ? args.push(new StringValue("ESDTRoleNFTBurn")) : 0;
        options.addRoleNFTUpdateAttributes ? args.push(new StringValue("ESDTRoleNFTUpdateAttributes")) : 0;
        options.addRoleNFTAddURI ? args.push(new StringValue("ESDTRoleNFTAddURI")) : 0;
        options.addRoleESDTTransferRole ? args.push(new StringValue("ESDTTransferRole")) : 0;
        options.addRoleESDTModifyCreator ? args.push(new StringValue("ESDTRoleModifyCreator")) : 0;
        options.addRoleNFTRecreate ? args.push(new StringValue("ESDTRoleNFTRecreate")) : 0;
        options.addRoleESDTSetNewURI ? args.push(new StringValue("ESDTRoleSetNewURI")) : 0;
        options.addRoleESDTModifyRoyalties ? args.push(new StringValue("ESDTRoleModifyRoyalties")) : 0;

        const dataParts = ["setSpecialRole", ...this.argSerializer.valuesToStrings(args)];

        const transaction = new Transaction({
            sender: sender,
            receiver: this.esdtContractAddress,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitSetSpecialRole);

        return transaction;
    }

    async createTransactionForUnsettingSpecialRoleOnNonFungibleToken(
        sender: Address,
        options: resources.UnsetSpecialRoleInput,
    ): Promise<Transaction> {
        const args = [new StringValue(options.tokenIdentifier), new AddressValue(options.user)];

        options.removeRoleNFTBurn ? args.push(new StringValue("ESDTRoleNFTBurn")) : 0;
        options.removeRoleNFTUpdateAttributes ? args.push(new StringValue("ESDTRoleNFTUpdateAttributes")) : 0;
        options.removeRoleNFTAddURI ? args.push(new StringValue("ESDTRoleNFTAddURI")) : 0;
        options.removeRoleESDTTransferRole ? args.push(new StringValue("ESDTTransferRole")) : 0;
        options.removeRoleESDTModifyCreator ? args.push(new StringValue("ESDTRoleModifyCreator")) : 0;
        options.removeRoleNFTRecreate ? args.push(new StringValue("ESDTRoleNFTRecreate")) : 0;
        options.removeRoleESDTSetNewURI ? args.push(new StringValue("ESDTRoleSetNewURI")) : 0;
        options.removeRoleESDTModifyRoyalties ? args.push(new StringValue("ESDTRoleModifyRoyalties")) : 0;

        const dataParts = ["unSetSpecialRole", ...this.argSerializer.valuesToStrings(args)];

        const transaction = new Transaction({
            sender: sender,
            receiver: this.esdtContractAddress,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitSetSpecialRole);

        return transaction;
    }

    async createTransactionForCreatingNFT(sender: Address, options: resources.MintInput): Promise<Transaction> {
        const dataParts = [
            "ESDTNFTCreate",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenIdentifier),
                new BigUIntValue(options.initialQuantity ?? 1n),
                new StringValue(options.name),
                new BigUIntValue(options.royalties),
                new StringValue(options.hash),
                new BytesValue(Buffer.from(options.attributes)),
                ...options.uris.map((uri) => new StringValue(uri)),
            ]),
        ];

        // Note that the following is an approximation (a reasonable one):
        const nftData = options.name + options.hash + options.attributes + options.uris.join("");
        const storageGasLimit = this.config.gasLimitStorePerByte + BigInt(nftData.length);

        const transaction = new Transaction({
            sender: sender,
            receiver: sender,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitEsdtNftCreate + storageGasLimit);

        return transaction;
    }

    async createTransactionForPausing(sender: Address, options: resources.PausingInput): Promise<Transaction> {
        const dataParts = ["pause", ...this.argSerializer.valuesToStrings([new StringValue(options.tokenIdentifier)])];

        const transaction = new Transaction({
            sender: sender,
            receiver: sender,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitPausing);

        return transaction;
    }

    async createTransactionForUnpausing(sender: Address, options: resources.PausingInput): Promise<Transaction> {
        const dataParts = [
            "unPause",
            ...this.argSerializer.valuesToStrings([new StringValue(options.tokenIdentifier)]),
        ];

        const transaction = new Transaction({
            sender: sender,
            receiver: sender,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitPausing);

        return transaction;
    }

    async createTransactionForFreezing(sender: Address, options: resources.ManagementInput): Promise<Transaction> {
        const dataParts = [
            "freeze",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenIdentifier),
                new AddressValue(options.user),
            ]),
        ];

        const transaction = new Transaction({
            sender: sender,
            receiver: sender,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitFreezing);

        return transaction;
    }

    async createTransactionForUnfreezing(sender: Address, options: resources.ManagementInput): Promise<Transaction> {
        const dataParts = [
            "UnFreeze",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenIdentifier),
                new AddressValue(options.user),
            ]),
        ];

        const transaction = new Transaction({
            sender: sender,
            receiver: sender,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitFreezing);

        return transaction;
    }

    async createTransactionForWiping(sender: Address, options: resources.ManagementInput): Promise<Transaction> {
        const dataParts = [
            "wipe",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenIdentifier),
                new AddressValue(options.user),
            ]),
        ];

        const transaction = new Transaction({
            sender: sender,
            receiver: sender,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitWiping);

        return transaction;
    }

    async createTransactionForLocalMint(sender: Address, options: resources.LocalMintInput): Promise<Transaction> {
        const dataParts = [
            "ESDTLocalMint",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenIdentifier),
                new BigUIntValue(options.supplyToMint),
            ]),
        ];

        const transaction = new Transaction({
            sender: sender,
            receiver: sender,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitEsdtLocalMint);

        return transaction;
    }

    async createTransactionForLocalBurning(sender: Address, options: resources.LocalBurnInput): Promise<Transaction> {
        const dataParts = [
            "ESDTLocalBurn",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenIdentifier),
                new BigUIntValue(options.supplyToBurn),
            ]),
        ];

        const transaction = new Transaction({
            sender: sender,
            receiver: sender,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitEsdtLocalBurn);

        return transaction;
    }

    async createTransactionForUpdatingAttributes(
        sender: Address,
        options: resources.UpdateAttributesInput,
    ): Promise<Transaction> {
        const dataParts = [
            "ESDTNFTUpdateAttributes",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenIdentifier),
                new BigUIntValue(options.tokenNonce),
                new BytesValue(Buffer.from(options.attributes)),
            ]),
        ];

        const transaction = new Transaction({
            sender: sender,
            receiver: sender,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitEsdtNftUpdateAttributes);

        return transaction;
    }

    async createTransactionForAddingQuantity(
        sender: Address,
        options: resources.UpdateQuantityInput,
    ): Promise<Transaction> {
        const dataParts = [
            "ESDTNFTAddQuantity",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenIdentifier),
                new BigUIntValue(options.tokenNonce),
                new BigUIntValue(options.quantity),
            ]),
        ];

        const transaction = new Transaction({
            sender: sender,
            receiver: sender,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitEsdtNftAddQuantity);

        return transaction;
    }

    async createTransactionForBurningQuantity(
        sender: Address,
        options: resources.UpdateQuantityInput,
    ): Promise<Transaction> {
        const dataParts = [
            "ESDTNFTBurn",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenIdentifier),
                new BigUIntValue(options.tokenNonce),
                new BigUIntValue(options.quantity),
            ]),
        ];

        const transaction = new Transaction({
            sender: sender,
            receiver: sender,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitEsdtNftBurn);

        return transaction;
    }

    async createTransactionForModifyingRoyalties(
        sender: Address,
        options: resources.ModifyRoyaltiesInput,
    ): Promise<Transaction> {
        const dataParts = [
            "ESDTModifyRoyalties",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenIdentifier),
                new BigUIntValue(options.tokenNonce),
                new BigUIntValue(options.newRoyalties),
            ]),
        ];

        const transaction = new Transaction({
            sender: sender,
            receiver: sender,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitEsdtModifyRoyalties);

        return transaction;
    }

    async createTransactionForSettingNewUris(sender: Address, options: resources.SetNewUriInput): Promise<Transaction> {
        if (!options.newUris.length) {
            throw new ErrBadUsage("No URIs provided");
        }

        const dataParts = [
            "ESDTSetNewURIs",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenIdentifier),
                new BigUIntValue(options.tokenNonce),
                ...options.newUris.map((uri) => new StringValue(uri)),
            ]),
        ];

        const transaction = new Transaction({
            sender: sender,
            receiver: sender,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitSetNewUris);

        return transaction;
    }

    async createTransactionForModifyingCreator(
        sender: Address,
        options: resources.ModifyCreatorInput,
    ): Promise<Transaction> {
        const dataParts = [
            "ESDTModifyCreator",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenIdentifier),
                new BigUIntValue(options.tokenNonce),
            ]),
        ];

        const transaction = new Transaction({
            sender: sender,
            receiver: sender,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitEsdtModifyCreator);

        return transaction;
    }

    async createTransactionForUpdatingMetadata(
        sender: Address,
        options: resources.ManageMetadataInput,
    ): Promise<Transaction> {
        const dataParts = [
            "ESDTMetaDataUpdate",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenIdentifier),
                new BigUIntValue(options.tokenNonce),
                ...(options.newTokenName ? [new StringValue(options.newTokenName)] : []),
                ...(options.newRoyalties ? [new BigUIntValue(options.newRoyalties)] : []),
                ...(options.newHash ? [new StringValue(options.newHash)] : []),
                ...(options.newAttributes ? [new BytesValue(Buffer.from(options.newAttributes))] : []),
                ...(options.newUris ? options.newUris.map((uri) => new StringValue(uri)) : []),
            ]),
        ];

        const transaction = new Transaction({
            sender: sender,
            receiver: sender,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitEsdtMetadataUpdate);

        return transaction;
    }

    async createTransactionForMetadataRecreate(
        sender: Address,
        options: resources.ManageMetadataInput,
    ): Promise<Transaction> {
        const dataParts = [
            "ESDTMetaDataRecreate",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenIdentifier),
                new BigUIntValue(options.tokenNonce),
                ...(options.newTokenName ? [new StringValue(options.newTokenName)] : []),
                ...(options.newRoyalties ? [new BigUIntValue(options.newRoyalties)] : []),
                ...(options.newHash ? [new StringValue(options.newHash)] : []),
                ...(options.newAttributes ? [new BytesValue(Buffer.from(options.newAttributes))] : []),
                ...(options.newUris ? options.newUris.map((uri) => new StringValue(uri)) : []),
            ]),
        ];

        const transaction = new Transaction({
            sender: sender,
            receiver: sender,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitNftMetadataRecreate);

        return transaction;
    }

    async createTransactionForChangingTokenToDynamic(
        sender: Address,
        options: resources.ChangeTokenToDynamicInput,
    ): Promise<Transaction> {
        const dataParts = [
            "changeToDynamic",
            ...this.argSerializer.valuesToStrings([new StringValue(options.tokenIdentifier)]),
        ];

        const transaction = new Transaction({
            sender: sender,
            receiver: this.esdtContractAddress,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitNftChangeToDynamic);

        return transaction;
    }

    async createTransactionForUpdatingTokenId(
        sender: Address,
        options: resources.UpdateTokenIDInput,
    ): Promise<Transaction> {
        const dataParts = [
            "updateTokenID",
            ...this.argSerializer.valuesToStrings([new StringValue(options.tokenIdentifier)]),
        ];

        const transaction = new Transaction({
            sender: sender,
            receiver: this.esdtContractAddress,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitUpdateTokenId);

        return transaction;
    }

    async createTransactionForRegisteringDynamicToken(
        sender: Address,
        options: resources.RegisteringDynamicTokenInput,
    ): Promise<Transaction> {
        const dataParts = [
            "registerDynamic",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenName),
                new StringValue(options.tokenTicker),
                new StringValue(options.tokenType),
            ]),
        ];

        const transaction = new Transaction({
            sender: sender,
            receiver: this.esdtContractAddress,
            chainID: this.config.chainID,
            gasLimit: 0n,
            value: this.config.issueCost,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitRegisterDynamic);

        return transaction;
    }

    async createTransactionForRegisteringDynamicAndSettingRoles(
        sender: Address,
        options: resources.RegisteringDynamicTokenInput,
    ): Promise<Transaction> {
        const dataParts = [
            "registerAndSetAllRolesDynamic",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenName),
                new StringValue(options.tokenTicker),
                new StringValue(options.tokenType),
            ]),
        ];

        const transaction = new Transaction({
            sender: sender,
            receiver: this.esdtContractAddress,
            chainID: this.config.chainID,
            gasLimit: 0n,
            value: this.config.issueCost,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitRegisterDynamic);

        return transaction;
    }

    private notifyAboutUnsettingBurnRoleGlobally() {
        Logger.info(`
==========
IMPORTANT!
==========
You are about to issue (register) a new token. This will set the role "ESDTRoleBurnForAll" (globally).
Once the token is registered, you can unset this role by calling "unsetBurnRoleGlobally" (in a separate transaction).`);
    }

    private boolToString(value: boolean): string {
        if (value) {
            return this.trueAsString;
        }

        return this.falseAsString;
    }
}
