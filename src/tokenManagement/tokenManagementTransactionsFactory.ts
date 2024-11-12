import { Address } from "../address";
import { ESDT_CONTRACT_ADDRESS_HEX } from "../constants";
import { ErrBadUsage } from "../errors";
import { IAddress } from "../interface";
import { Logger } from "../logger";
import { AddressValue, ArgSerializer, BigUIntValue, BytesValue, StringValue } from "../smartcontracts";
import { Transaction } from "../transaction";
import { TransactionBuilder } from "../transactionsFactories/transactionBuilder";

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

type TokenType = "NFT" | "SFT" | "META" | "FNG";

/**
 * Use this class to create token management transactions like issuing ESDTs, creating NFTs, setting roles, etc.
 */
export class TokenManagementTransactionsFactory {
    private readonly config: IConfig;
    private readonly argSerializer: ArgSerializer;
    private readonly trueAsString: string;
    private readonly falseAsString: string;
    private readonly esdtContractAddress: Address;

    constructor(options: { config: IConfig }) {
        this.config = options.config;
        this.argSerializer = new ArgSerializer();
        this.trueAsString = "true";
        this.falseAsString = "false";
        this.esdtContractAddress = Address.fromHex(ESDT_CONTRACT_ADDRESS_HEX, this.config.addressHrp);
    }

    createTransactionForIssuingFungible(options: {
        sender: IAddress;
        tokenName: string;
        tokenTicker: string;
        initialSupply: bigint;
        numDecimals: bigint;
        canFreeze: boolean;
        canWipe: boolean;
        canPause: boolean;
        canChangeOwner: boolean;
        canUpgrade: boolean;
        canAddSpecialRoles: boolean;
    }): Transaction {
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

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: this.esdtContractAddress,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitIssue,
            addDataMovementGas: true,
            amount: this.config.issueCost,
        }).build();
    }

    createTransactionForIssuingSemiFungible(options: {
        sender: IAddress;
        tokenName: string;
        tokenTicker: string;
        canFreeze: boolean;
        canWipe: boolean;
        canPause: boolean;
        canTransferNFTCreateRole: boolean;
        canChangeOwner: boolean;
        canUpgrade: boolean;
        canAddSpecialRoles: boolean;
    }): Transaction {
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

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: this.esdtContractAddress,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitIssue,
            addDataMovementGas: true,
            amount: this.config.issueCost,
        }).build();
    }

    createTransactionForIssuingNonFungible(options: {
        sender: IAddress;
        tokenName: string;
        tokenTicker: string;
        canFreeze: boolean;
        canWipe: boolean;
        canPause: boolean;
        canTransferNFTCreateRole: boolean;
        canChangeOwner: boolean;
        canUpgrade: boolean;
        canAddSpecialRoles: boolean;
    }): Transaction {
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

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: this.esdtContractAddress,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitIssue,
            addDataMovementGas: true,
            amount: this.config.issueCost,
        }).build();
    }

    createTransactionForRegisteringMetaESDT(options: {
        sender: IAddress;
        tokenName: string;
        tokenTicker: string;
        numDecimals: bigint;
        canFreeze: boolean;
        canWipe: boolean;
        canPause: boolean;
        canTransferNFTCreateRole: boolean;
        canChangeOwner: boolean;
        canUpgrade: boolean;
        canAddSpecialRoles: boolean;
    }): Transaction {
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

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: this.esdtContractAddress,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitIssue,
            addDataMovementGas: true,
            amount: this.config.issueCost,
        }).build();
    }

    createTransactionForRegisteringAndSettingRoles(options: {
        sender: IAddress;
        tokenName: string;
        tokenTicker: string;
        tokenType: TokenType;
        numDecimals: bigint;
    }): Transaction {
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

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: this.esdtContractAddress,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitIssue,
            addDataMovementGas: true,
            amount: this.config.issueCost,
        }).build();
    }

    createTransactionForSettingBurnRoleGlobally(options: { sender: IAddress; tokenIdentifier: string }): Transaction {
        const dataParts = [
            "setBurnRoleGlobally",
            ...this.argSerializer.valuesToStrings([new StringValue(options.tokenIdentifier)]),
        ];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: this.esdtContractAddress,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitToggleBurnRoleGlobally,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForUnsettingBurnRoleGlobally(options: { sender: IAddress; tokenIdentifier: string }): Transaction {
        const dataParts = [
            "unsetBurnRoleGlobally",
            ...this.argSerializer.valuesToStrings([new StringValue(options.tokenIdentifier)]),
        ];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: this.esdtContractAddress,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitToggleBurnRoleGlobally,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForSettingSpecialRoleOnFungibleToken(options: {
        sender: IAddress;
        user: IAddress;
        tokenIdentifier: string;
        addRoleLocalMint: boolean;
        addRoleLocalBurn: boolean;
        addRoleESDTTransferRole: boolean;
    }): Transaction {
        const args = [new StringValue(options.tokenIdentifier), new AddressValue(options.user)];

        options.addRoleLocalMint ? args.push(new StringValue("ESDTRoleLocalMint")) : 0;
        options.addRoleLocalBurn ? args.push(new StringValue("ESDTRoleLocalBurn")) : 0;
        options.addRoleESDTTransferRole ? args.push(new StringValue("ESDTTransferRole")) : 0;

        const dataParts = ["setSpecialRole", ...this.argSerializer.valuesToStrings(args)];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: this.esdtContractAddress,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitSetSpecialRole,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForSettingSpecialRoleOnSemiFungibleToken(options: {
        sender: IAddress;
        user: IAddress;
        tokenIdentifier: string;
        addRoleNFTCreate: boolean;
        addRoleNFTBurn: boolean;
        addRoleNFTAddQuantity: boolean;
        addRoleESDTTransferRole: boolean;
        addRoleESDTModifyCreator?: boolean;
    }): Transaction {
        const args = [new StringValue(options.tokenIdentifier), new AddressValue(options.user)];

        options.addRoleNFTCreate ? args.push(new StringValue("ESDTRoleNFTCreate")) : 0;
        options.addRoleNFTBurn ? args.push(new StringValue("ESDTRoleNFTBurn")) : 0;
        options.addRoleNFTAddQuantity ? args.push(new StringValue("ESDTRoleNFTAddQuantity")) : 0;
        options.addRoleESDTTransferRole ? args.push(new StringValue("ESDTTransferRole")) : 0;
        options.addRoleESDTModifyCreator ? args.push(new StringValue("ESDTRoleModifyCreator")) : 0;

        const dataParts = ["setSpecialRole", ...this.argSerializer.valuesToStrings(args)];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: this.esdtContractAddress,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitSetSpecialRole,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForSettingSpecialRoleOnMetaESDT(options: {
        sender: IAddress;
        user: IAddress;
        tokenIdentifier: string;
        addRoleNFTCreate: boolean;
        addRoleNFTBurn: boolean;
        addRoleNFTAddQuantity: boolean;
        addRoleESDTTransferRole: boolean;
    }): Transaction {
        return this.createTransactionForSettingSpecialRoleOnSemiFungibleToken(options);
    }

    createTransactionForSettingSpecialRoleOnNonFungibleToken(options: {
        sender: IAddress;
        user: IAddress;
        tokenIdentifier: string;
        addRoleNFTCreate: boolean;
        addRoleNFTBurn: boolean;
        addRoleNFTUpdateAttributes: boolean;
        addRoleNFTAddURI: boolean;
        addRoleESDTTransferRole: boolean;
        addRoleESDTModifyCreator?: boolean;
        addRoleNFTRecreate?: boolean;
        addRoleESDTSetNewURI?: boolean;
        addRoleESDTModifyRoyalties?: boolean;
    }): Transaction {
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

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: this.esdtContractAddress,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitSetSpecialRole,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForCreatingNFT(options: {
        sender: IAddress;
        tokenIdentifier: string;
        initialQuantity: bigint;
        name: string;
        royalties: number;
        hash: string;
        attributes: Uint8Array;
        uris: string[];
    }): Transaction {
        const dataParts = [
            "ESDTNFTCreate",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenIdentifier),
                new BigUIntValue(options.initialQuantity),
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

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitEsdtNftCreate + storageGasLimit,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForPausing(options: { sender: IAddress; tokenIdentifier: string }): Transaction {
        const dataParts = ["pause", ...this.argSerializer.valuesToStrings([new StringValue(options.tokenIdentifier)])];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitPausing,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForUnpausing(options: { sender: IAddress; tokenIdentifier: string }): Transaction {
        const dataParts = [
            "unPause",
            ...this.argSerializer.valuesToStrings([new StringValue(options.tokenIdentifier)]),
        ];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitPausing,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForFreezing(options: { sender: IAddress; user: IAddress; tokenIdentifier: string }): Transaction {
        const dataParts = [
            "freeze",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenIdentifier),
                new AddressValue(options.user),
            ]),
        ];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitFreezing,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForUnfreezing(options: {
        sender: IAddress;
        user: IAddress;
        tokenIdentifier: string;
    }): Transaction {
        const dataParts = [
            "UnFreeze",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenIdentifier),
                new AddressValue(options.user),
            ]),
        ];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitFreezing,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForWiping(options: { sender: IAddress; user: IAddress; tokenIdentifier: string }): Transaction {
        const dataParts = [
            "wipe",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenIdentifier),
                new AddressValue(options.user),
            ]),
        ];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitWiping,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForLocalMint(options: {
        sender: IAddress;
        tokenIdentifier: string;
        supplyToMint: bigint;
    }): Transaction {
        const dataParts = [
            "ESDTLocalMint",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenIdentifier),
                new BigUIntValue(options.supplyToMint),
            ]),
        ];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitEsdtLocalMint,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForLocalBurning(options: {
        sender: IAddress;
        tokenIdentifier: string;
        supplyToBurn: bigint;
    }): Transaction {
        const dataParts = [
            "ESDTLocalBurn",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenIdentifier),
                new BigUIntValue(options.supplyToBurn),
            ]),
        ];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitEsdtLocalBurn,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForUpdatingAttributes(options: {
        sender: IAddress;
        tokenIdentifier: string;
        tokenNonce: bigint;
        attributes: Uint8Array;
    }): Transaction {
        const dataParts = [
            "ESDTNFTUpdateAttributes",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenIdentifier),
                new BigUIntValue(options.tokenNonce),
                new BytesValue(Buffer.from(options.attributes)),
            ]),
        ];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitEsdtNftUpdateAttributes,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForAddingQuantity(options: {
        sender: IAddress;
        tokenIdentifier: string;
        tokenNonce: bigint;
        quantityToAdd: bigint;
    }): Transaction {
        const dataParts = [
            "ESDTNFTAddQuantity",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenIdentifier),
                new BigUIntValue(options.tokenNonce),
                new BigUIntValue(options.quantityToAdd),
            ]),
        ];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitEsdtNftAddQuantity,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForBurningQuantity(options: {
        sender: IAddress;
        tokenIdentifier: string;
        tokenNonce: bigint;
        quantityToBurn: bigint;
    }): Transaction {
        const dataParts = [
            "ESDTNFTBurn",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenIdentifier),
                new BigUIntValue(options.tokenNonce),
                new BigUIntValue(options.quantityToBurn),
            ]),
        ];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitEsdtNftBurn,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForModifyingRoyalties(options: {
        sender: IAddress;
        tokenIdentifier: string;
        tokenNonce: bigint;
        newRoyalties: bigint;
    }): Transaction {
        const dataParts = [
            "ESDTModifyRoyalties",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenIdentifier),
                new BigUIntValue(options.tokenNonce),
                new BigUIntValue(options.newRoyalties),
            ]),
        ];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitEsdtModifyRoyalties,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForSettingNewUris(options: {
        sender: IAddress;
        tokenIdentifier: string;
        tokenNonce: bigint;
        newUris: string[];
    }): Transaction {
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

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitSetNewUris,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForModifyingCreator(options: {
        sender: IAddress;
        tokenIdentifier: string;
        tokenNonce: bigint;
    }): Transaction {
        const dataParts = [
            "ESDTModifyCreator",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenIdentifier),
                new BigUIntValue(options.tokenNonce),
            ]),
        ];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitEsdtModifyCreator,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForUpdatingMetadata(options: {
        sender: IAddress;
        tokenIdentifier: string;
        tokenNonce: bigint;
        newTokenName?: string;
        newRoyalties?: bigint;
        newHash?: string;
        newAttributes?: Uint8Array;
        newUris?: string[];
    }): Transaction {
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

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitEsdtMetadataUpdate,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForMetadataRecreate(options: {
        sender: IAddress;
        tokenIdentifier: string;
        tokenNonce: bigint;
        newTokenName: string;
        newRoyalties: bigint;
        newHash: string;
        newAttributes: Uint8Array;
        newUris: string[];
    }): Transaction {
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

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitNftMetadataRecreate,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForChangingTokenToDynamic(options: { sender: IAddress; tokenIdentifier: string }): Transaction {
        const dataParts = [
            "changeToDynamic",
            ...this.argSerializer.valuesToStrings([new StringValue(options.tokenIdentifier)]),
        ];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: this.esdtContractAddress,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitNftChangeToDynamic,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForUpdatingTokenId(options: { sender: IAddress; tokenIdentifier: string }): Transaction {
        const dataParts = [
            "updateTokenID",
            ...this.argSerializer.valuesToStrings([new StringValue(options.tokenIdentifier)]),
        ];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: this.esdtContractAddress,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitUpdateTokenId,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForRegisteringDynamicToken(options: {
        sender: IAddress;
        tokenName: string;
        tokenTicker: string;
        tokenType: TokenType;
    }): Transaction {
        const dataParts = [
            "registerDynamic",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenName),
                new StringValue(options.tokenTicker),
                new StringValue(options.tokenType),
            ]),
        ];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: this.esdtContractAddress,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitRegisterDynamic,
            addDataMovementGas: true,
            amount: this.config.issueCost,
        }).build();
    }

    createTransactionForRegisteringDynamicAndSettingRoles(options: {
        sender: IAddress;
        tokenName: string;
        tokenTicker: string;
        tokenType: TokenType;
    }): Transaction {
        const dataParts = [
            "registerAndSetAllRolesDynamic",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenName),
                new StringValue(options.tokenTicker),
                new StringValue(options.tokenType),
            ]),
        ];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: this.esdtContractAddress,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitRegisterDynamic,
            addDataMovementGas: true,
            amount: this.config.issueCost,
        }).build();
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
