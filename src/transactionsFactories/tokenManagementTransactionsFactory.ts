import { Address } from "../address";
import { ESDT_CONTRACT_ADDRESS } from "../constants";
import { IAddress } from "../interface";
import { Logger } from "../logger";
import { Transaction } from "../transaction";
import { addressToHex, byteArrayToHex, numberToPaddedHex, utf8ToHex } from "../utils.codec";
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
    private readonly trueAsHex: string;
    private readonly falseAsHex: string;

    constructor(config: Config) {
        this.config = config;
        this.trueAsHex = utf8ToHex("true");
        this.falseAsHex = utf8ToHex("false");
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
            utf8ToHex(options.tokenName),
            utf8ToHex(options.tokenTicker),
            numberToPaddedHex(options.initialSupply),
            numberToPaddedHex(options.numDecimals),
            utf8ToHex("canFreeze"),
            options.canFreeze ? this.trueAsHex : this.falseAsHex,
            utf8ToHex("canWipe"),
            options.canWipe ? this.trueAsHex : this.falseAsHex,
            utf8ToHex("canPause"),
            options.canPause ? this.trueAsHex : this.falseAsHex,
            utf8ToHex("canChangeOwner"),
            options.canChangeOwner ? this.trueAsHex : this.falseAsHex,
            utf8ToHex("canUpgrade"),
            options.canUpgrade ? this.trueAsHex : this.falseAsHex,
            utf8ToHex("canAddSpecialRoles"),
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
            utf8ToHex(options.tokenName),
            utf8ToHex(options.tokenTicker),
            utf8ToHex("canFreeze"),
            options.canFreeze ? this.trueAsHex : this.falseAsHex,
            utf8ToHex("canWipe"),
            options.canWipe ? this.trueAsHex : this.falseAsHex,
            utf8ToHex("canPause"),
            options.canPause ? this.trueAsHex : this.falseAsHex,
            utf8ToHex("canTransferNFTCreateRole"),
            options.canTransferNFTCreateRole ? this.trueAsHex : this.falseAsHex,
            utf8ToHex("canChangeOwner"),
            options.canChangeOwner ? this.trueAsHex : this.falseAsHex,
            utf8ToHex("canUpgrade"),
            options.canUpgrade ? this.trueAsHex : this.falseAsHex,
            utf8ToHex("canAddSpecialRoles"),
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
            utf8ToHex(options.tokenName),
            utf8ToHex(options.tokenTicker),
            utf8ToHex("canFreeze"),
            options.canFreeze ? this.trueAsHex : this.falseAsHex,
            utf8ToHex("canWipe"),
            options.canWipe ? this.trueAsHex : this.falseAsHex,
            utf8ToHex("canPause"),
            options.canPause ? this.trueAsHex : this.falseAsHex,
            utf8ToHex("canTransferNFTCreateRole"),
            options.canTransferNFTCreateRole ? this.trueAsHex : this.falseAsHex,
            utf8ToHex("canChangeOwner"),
            options.canChangeOwner ? this.trueAsHex : this.falseAsHex,
            utf8ToHex("canUpgrade"),
            options.canUpgrade ? this.trueAsHex : this.falseAsHex,
            utf8ToHex("canAddSpecialRoles"),
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
            utf8ToHex(options.tokenName),
            utf8ToHex(options.tokenTicker),
            numberToPaddedHex(options.numDecimals),
            utf8ToHex("canFreeze"),
            options.canFreeze ? this.trueAsHex : this.falseAsHex,
            utf8ToHex("canWipe"),
            options.canWipe ? this.trueAsHex : this.falseAsHex,
            utf8ToHex("canPause"),
            options.canPause ? this.trueAsHex : this.falseAsHex,
            utf8ToHex("canTransferNFTCreateRole"),
            options.canTransferNFTCreateRole ? this.trueAsHex : this.falseAsHex,
            utf8ToHex("canChangeOwner"),
            options.canChangeOwner ? this.trueAsHex : this.falseAsHex,
            utf8ToHex("canUpgrade"),
            options.canUpgrade ? this.trueAsHex : this.falseAsHex,
            utf8ToHex("canAddSpecialRoles"),
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
            utf8ToHex(options.tokenName),
            utf8ToHex(options.tokenTicker),
            utf8ToHex(options.tokenType),
            numberToPaddedHex(options.numDecimals),
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

    createTransactionForSettingBurnRoleGlobally(options: {
        sender: IAddress;
        tokenIdentifier: string;
    }): Transaction {
        const dataParts = ["setBurnRoleGlobally", utf8ToHex(options.tokenIdentifier)];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(ESDT_CONTRACT_ADDRESS),
            dataParts: dataParts,
            gasLimit: this.config.gasLimitToggleBurnRoleGlobally,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForUnsettingBurnRoleGlobally(options: {
        sender: IAddress;
        tokenIdentifier: string;
    }): Transaction {
        const dataParts = ["unsetBurnRoleGlobally", utf8ToHex(options.tokenIdentifier)];

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
            utf8ToHex(options.tokenIdentifier),
            addressToHex(options.user),
            ...(options.addRoleLocalMint ? [utf8ToHex("ESDTRoleLocalMint")] : []),
            ...(options.addRoleLocalBurn ? [utf8ToHex("ESDTRoleLocalBurn")] : []),
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
            utf8ToHex(options.tokenIdentifier),
            addressToHex(options.user),
            ...(options.addRoleNFTCreate ? [utf8ToHex("ESDTRoleNFTCreate")] : []),
            ...(options.addRoleNFTBurn ? [utf8ToHex("ESDTRoleNFTBurn")] : []),
            ...(options.addRoleNFTAddQuantity ? [utf8ToHex("ESDTRoleNFTAddQuantity")] : []),
            ...(options.addRoleESDTTransferRole ? [utf8ToHex("ESDTTransferRole")] : []),
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
            utf8ToHex(options.tokenIdentifier),
            addressToHex(options.user),
            ...(options.addRoleNFTCreate ? [utf8ToHex("ESDTRoleNFTCreate")] : []),
            ...(options.addRoleNFTBurn ? [utf8ToHex("ESDTRoleNFTBurn")] : []),
            ...(options.addRoleNFTUpdateAttributes ? [utf8ToHex("ESDTRoleNFTUpdateAttributes")] : []),
            ...(options.addRoleNFTAddURI ? [utf8ToHex("ESDTRoleNFTAddURI")] : []),
            ...(options.addRoleESDTTransferRole ? [utf8ToHex("ESDTTransferRole")] : []),
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
            utf8ToHex(options.tokenIdentifier),
            numberToPaddedHex(options.initialQuantity),
            utf8ToHex(options.name),
            numberToPaddedHex(options.royalties),
            utf8ToHex(options.hash),
            byteArrayToHex(options.attributes),
            ...options.uris.map(utf8ToHex),
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
        const dataParts = ["pause", utf8ToHex(options.tokenIdentifier)];

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
        const dataParts = ["unPause", utf8ToHex(options.tokenIdentifier)];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitPausing,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForFreezing(options: {
        sender: IAddress;
        user: IAddress;
        tokenIdentifier: string;
    }): Transaction {
        const dataParts = ["freeze", utf8ToHex(options.tokenIdentifier), addressToHex(options.user)];

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
        const dataParts = ["UnFreeze", utf8ToHex(options.tokenIdentifier), addressToHex(options.user)];

        return new TransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitFreezing,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForWiping(options: {
        sender: IAddress;
        user: IAddress;
        tokenIdentifier: string;
    }): Transaction {
        const dataParts = ["wipe", utf8ToHex(options.tokenIdentifier), addressToHex(options.user)];

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
            utf8ToHex(options.tokenIdentifier),
            numberToPaddedHex(options.supplyToMint),
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
            utf8ToHex(options.tokenIdentifier),
            numberToPaddedHex(options.supplyToBurn),
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
            utf8ToHex(options.tokenIdentifier),
            numberToPaddedHex(options.tokenNonce),
            byteArrayToHex(options.attributes),
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
            utf8ToHex(options.tokenIdentifier),
            numberToPaddedHex(options.tokenNonce),
            numberToPaddedHex(options.quantityToAdd),
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
            utf8ToHex(options.tokenIdentifier),
            numberToPaddedHex(options.tokenNonce),
            numberToPaddedHex(options.quantityToBurn),
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
