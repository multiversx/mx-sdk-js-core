import { Address } from "../address";
import { ESDT_CONTRACT_ADDRESS } from "../constants";
import { IAddress } from "../interface";
import { Logger } from "../logger";
import { AddressValue, ArgSerializer, BigUIntValue, BytesValue, StringValue } from "../smartcontracts";
import { Transaction } from "../transaction";
import { TransactionBuilder } from "./transactionBuilder";

interface Config {
    chainID: string;
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
    issueCost: bigint;
}

type RegisterAndSetAllRolesTokenType = "NFT" | "SFT" | "META" | "FNG";

/**
 * Use this class to create token management transactions like issuing ESDTs, creating NFTs, setting roles, etc.
 */
export class TokenManagementTransactionsFactory {
    private readonly config: Config;
    private readonly argSerializer: ArgSerializer;
    private readonly trueAsHex: string;
    private readonly falseAsHex: string;

    constructor(options: { config: Config }) {
        this.config = options.config;
        this.argSerializer = new ArgSerializer();
        this.trueAsHex = this.argSerializer.valuesToStrings([new StringValue("true")])[0];
        this.falseAsHex = this.argSerializer.valuesToStrings([new StringValue("false")])[0];
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

        const dataParts = [
            "issue",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenName),
                new StringValue(options.tokenTicker),
            ]),
            ...this.argSerializer.valuesToStrings([
                new BigUIntValue(options.initialSupply),
                new BigUIntValue(options.numDecimals),
            ]),
            this.argSerializer.valuesToStrings([new StringValue("canFreeze")])[0],
            options.canFreeze ? this.trueAsHex : this.falseAsHex,
            this.argSerializer.valuesToStrings([new StringValue("canWipe")])[0],
            options.canWipe ? this.trueAsHex : this.falseAsHex,
            this.argSerializer.valuesToStrings([new StringValue("canPause")])[0],
            options.canPause ? this.trueAsHex : this.falseAsHex,
            this.argSerializer.valuesToStrings([new StringValue("canChangeOwner")])[0],
            options.canChangeOwner ? this.trueAsHex : this.falseAsHex,
            this.argSerializer.valuesToStrings([new StringValue("canUpgrade")])[0],
            options.canUpgrade ? this.trueAsHex : this.falseAsHex,
            this.argSerializer.valuesToStrings([new StringValue("canAddSpecialRoles")])[0],
            options.canAddSpecialRoles ? this.trueAsHex : this.falseAsHex,
        ];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(ESDT_CONTRACT_ADDRESS),
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

        const dataParts = [
            "issueSemiFungible",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenName),
                new StringValue(options.tokenTicker),
                new StringValue("canFreeze"),
            ]),
            options.canFreeze ? this.trueAsHex : this.falseAsHex,
            this.argSerializer.valuesToStrings([new StringValue("canWipe")])[0],
            options.canWipe ? this.trueAsHex : this.falseAsHex,
            this.argSerializer.valuesToStrings([new StringValue("canPause")])[0],
            options.canPause ? this.trueAsHex : this.falseAsHex,
            this.argSerializer.valuesToStrings([new StringValue("canTransferNFTCreateRole")])[0],
            options.canTransferNFTCreateRole ? this.trueAsHex : this.falseAsHex,
            this.argSerializer.valuesToStrings([new StringValue("canChangeOwner")])[0],
            options.canChangeOwner ? this.trueAsHex : this.falseAsHex,
            this.argSerializer.valuesToStrings([new StringValue("canUpgrade")])[0],
            options.canUpgrade ? this.trueAsHex : this.falseAsHex,
            this.argSerializer.valuesToStrings([new StringValue("canAddSpecialRoles")])[0],
            options.canAddSpecialRoles ? this.trueAsHex : this.falseAsHex,
        ];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(ESDT_CONTRACT_ADDRESS),
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

        const dataParts = [
            "issueNonFungible",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenName),
                new StringValue(options.tokenTicker),
                new StringValue("canFreeze"),
            ]),
            options.canFreeze ? this.trueAsHex : this.falseAsHex,
            this.argSerializer.valuesToStrings([new StringValue("canWipe")])[0],
            options.canWipe ? this.trueAsHex : this.falseAsHex,
            this.argSerializer.valuesToStrings([new StringValue("canPause")])[0],
            options.canPause ? this.trueAsHex : this.falseAsHex,
            this.argSerializer.valuesToStrings([new StringValue("canTransferNFTCreateRole")])[0],
            options.canTransferNFTCreateRole ? this.trueAsHex : this.falseAsHex,
            this.argSerializer.valuesToStrings([new StringValue("canChangeOwner")])[0],
            options.canChangeOwner ? this.trueAsHex : this.falseAsHex,
            this.argSerializer.valuesToStrings([new StringValue("canUpgrade")])[0],
            options.canUpgrade ? this.trueAsHex : this.falseAsHex,
            this.argSerializer.valuesToStrings([new StringValue("canAddSpecialRoles")])[0],
            options.canAddSpecialRoles ? this.trueAsHex : this.falseAsHex,
        ];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(ESDT_CONTRACT_ADDRESS),
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

        const dataParts = [
            "registerMetaESDT",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenName),
                new StringValue(options.tokenTicker),
                new BigUIntValue(options.numDecimals),
                new StringValue("canFreeze"),
            ]),
            options.canFreeze ? this.trueAsHex : this.falseAsHex,
            this.argSerializer.valuesToStrings([new StringValue("canWipe")])[0],
            options.canWipe ? this.trueAsHex : this.falseAsHex,
            this.argSerializer.valuesToStrings([new StringValue("canPause")])[0],
            options.canPause ? this.trueAsHex : this.falseAsHex,
            this.argSerializer.valuesToStrings([new StringValue("canTransferNFTCreateRole")])[0],
            options.canTransferNFTCreateRole ? this.trueAsHex : this.falseAsHex,
            this.argSerializer.valuesToStrings([new StringValue("canChangeOwner")])[0],
            options.canChangeOwner ? this.trueAsHex : this.falseAsHex,
            this.argSerializer.valuesToStrings([new StringValue("canUpgrade")])[0],
            options.canUpgrade ? this.trueAsHex : this.falseAsHex,
            this.argSerializer.valuesToStrings([new StringValue("canAddSpecialRoles")])[0],
            options.canAddSpecialRoles ? this.trueAsHex : this.falseAsHex,
        ];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(ESDT_CONTRACT_ADDRESS),
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
        tokenType: RegisterAndSetAllRolesTokenType;
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
            receiver: Address.fromBech32(ESDT_CONTRACT_ADDRESS),
            dataParts: dataParts,
            gasLimit: this.config.gasLimitIssue,
            addDataMovementGas: true,
            amount: this.config.issueCost,
        }).build();
    }

    createTransactionForSettingBurnRoleGlobally(options: { sender: IAddress; tokenIdentifier: string }): Transaction {
        const dataParts = [
            "setBurnRoleGlobally",
            this.argSerializer.valuesToStrings([new StringValue(options.tokenIdentifier)])[0],
        ];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(ESDT_CONTRACT_ADDRESS),
            dataParts: dataParts,
            gasLimit: this.config.gasLimitToggleBurnRoleGlobally,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForUnsettingBurnRoleGlobally(options: { sender: IAddress; tokenIdentifier: string }): Transaction {
        const dataParts = [
            "unsetBurnRoleGlobally",
            this.argSerializer.valuesToStrings([new StringValue(options.tokenIdentifier)])[0],
        ];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(ESDT_CONTRACT_ADDRESS),
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
    }): Transaction {
        const dataParts = [
            "setSpecialRole",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenIdentifier),
                new AddressValue(options.user),
            ]),
            ...(options.addRoleLocalMint
                ? this.argSerializer.valuesToStrings([new StringValue("ESDTRoleLocalMint")])
                : []),
            ...(options.addRoleLocalBurn
                ? this.argSerializer.valuesToStrings([new StringValue("ESDTRoleLocalBurn")])
                : []),
        ];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(ESDT_CONTRACT_ADDRESS),
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
    }): Transaction {
        const dataParts = [
            "setSpecialRole",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenIdentifier),
                new AddressValue(options.user),
            ]),
            ...(options.addRoleNFTCreate
                ? this.argSerializer.valuesToStrings([new StringValue("ESDTRoleNFTCreate")])
                : []),
            ...(options.addRoleNFTBurn ? this.argSerializer.valuesToStrings([new StringValue("ESDTRoleNFTBurn")]) : []),
            ...(options.addRoleNFTAddQuantity
                ? this.argSerializer.valuesToStrings([new StringValue("ESDTRoleNFTAddQuantity")])
                : []),
            ...(options.addRoleESDTTransferRole
                ? this.argSerializer.valuesToStrings([new StringValue("ESDTTransferRole")])
                : []),
        ];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(ESDT_CONTRACT_ADDRESS),
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
    }): Transaction {
        const dataParts = [
            "setSpecialRole",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.tokenIdentifier),
                new AddressValue(options.user),
            ]),
            ...(options.addRoleNFTCreate
                ? this.argSerializer.valuesToStrings([new StringValue("ESDTRoleNFTCreate")])
                : []),
            ...(options.addRoleNFTBurn ? this.argSerializer.valuesToStrings([new StringValue("ESDTRoleNFTBurn")]) : []),
            ...(options.addRoleNFTUpdateAttributes
                ? this.argSerializer.valuesToStrings([new StringValue("ESDTRoleNFTUpdateAttributes")])
                : []),
            ...(options.addRoleNFTAddURI
                ? this.argSerializer.valuesToStrings([new StringValue("ESDTRoleNFTAddURI")])
                : []),
            ...(options.addRoleESDTTransferRole
                ? this.argSerializer.valuesToStrings([new StringValue("ESDTTransferRole")])
                : []),
        ];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(ESDT_CONTRACT_ADDRESS),
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
        const storageGasLimit = this.config.gasLimitPerByte + BigInt(nftData.length);

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
        const dataParts = ["pause", this.argSerializer.valuesToStrings([new StringValue(options.tokenIdentifier)])[0]];

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
            this.argSerializer.valuesToStrings([new StringValue(options.tokenIdentifier)])[0],
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

    private notifyAboutUnsettingBurnRoleGlobally() {
        Logger.info(`
==========
IMPORTANT!
==========
You are about to issue (register) a new token. This will set the role "ESDTRoleBurnForAll" (globally).
Once the token is registered, you can unset this role by calling "unsetBurnRoleGlobally" (in a separate transaction).`);
    }
}
