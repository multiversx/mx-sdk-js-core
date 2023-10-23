import BigNumber from "bignumber.js";
import { DraftTransaction } from "../draftTransaction";
import { DraftTransactionBuilder } from "./draftTransactionBuilder";
import { IAddress } from "../interface";
import { utf8ToHex, bigIntToHex, addressToHex, byteArrayToHex } from "../utils.codec";
import { ESDT_CONTRACT_ADDRESS } from "../constants";
import { Address } from "../address";
import { Logger } from "../logger";

interface Config {
    chainID: string
    minGasLimit: BigNumber.Value
    gasLimitPerByte: BigNumber.Value
    gasLimitIssue: BigNumber.Value
    gasLimitToggleBurnRoleGlobally: BigNumber.Value
    gasLimitEsdtLocalMint: BigNumber.Value
    gasLimitEsdtLocalBurn: BigNumber.Value
    gasLimitSetSpecialRole: BigNumber.Value
    gasLimitPausing: BigNumber.Value
    gasLimitFreezing: BigNumber.Value
    gasLimitWiping: BigNumber.Value
    gasLimitEsdtNftCreate: BigNumber.Value
    gasLimitEsdtNftUpdateAttributes: BigNumber.Value
    gasLimitEsdtNftAddQuantity: BigNumber.Value
    gasLimitEsdtNftBurn: BigNumber.Value
    gasLimitStorePerByte: BigNumber.Value
    issueCost: BigNumber.Value
}

type RegisterAndSetAllRolesTokenType = "NFT" | "SFT" | "META" | "FNG";

export class TokenManagementTransactionsFactory {
    private readonly config: Config;
    private readonly trueAsHex: string;

    constructor(config: Config) {
        this.config = config;
        this.trueAsHex = utf8ToHex("true");
    }

    createTransactionForIssuingFungible(options: {
        sender: IAddress,
        tokenName: string,
        tokenTicker: string,
        initialSupply: BigNumber.Value,
        numDecimals: BigNumber.Value,
        canFreeze: boolean,
        canWipe: boolean,
        canPause: boolean,
        canTransferNFTCreateRole: boolean,
        canChangeOwner: boolean,
        canUpgrade: boolean,
        canAddSpecialRoles: boolean
    }): DraftTransaction {
        this.notifyAboutUnsettingBurnRoleGlobally();

        const dataParts = [
            "issue",
            utf8ToHex(options.tokenName),
            utf8ToHex(options.tokenTicker),
            bigIntToHex(options.initialSupply),
            bigIntToHex(options.numDecimals),
            ...(options.canFreeze ? [utf8ToHex("canFreeze"), this.trueAsHex] : []),
            ...(options.canWipe ? [utf8ToHex("canWipe"), this.trueAsHex] : []),
            ...(options.canPause ? [utf8ToHex("canPause"), this.trueAsHex] : []),
            ...(options.canTransferNFTCreateRole ? [utf8ToHex("canTransferNFTCreateRole"), this.trueAsHex] : []),
            ...(options.canChangeOwner ? [utf8ToHex("canChangeOwner"), this.trueAsHex] : []),
            ...[utf8ToHex("canUpgrade"), utf8ToHex(String(options.canUpgrade).toLowerCase())],
            ...[utf8ToHex("canAddSpecialRoles"), utf8ToHex(String(options.canAddSpecialRoles).toLowerCase())]
        ];

        return new DraftTransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(ESDT_CONTRACT_ADDRESS),
            dataParts: dataParts,
            gasLimit: this.config.gasLimitIssue,
            addDataMovementGas: true,
            amount: this.config.issueCost
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
    }): DraftTransaction {
        this.notifyAboutUnsettingBurnRoleGlobally();

        const dataParts = [
            "issueSemiFungible",
            utf8ToHex(options.tokenName),
            utf8ToHex(options.tokenTicker),
            ...(options.canFreeze ? [utf8ToHex("canFreeze"), this.trueAsHex] : []),
            ...(options.canWipe ? [utf8ToHex("canWipe"), this.trueAsHex] : []),
            ...(options.canPause ? [utf8ToHex("canPause"), this.trueAsHex] : []),
            ...(options.canTransferNFTCreateRole ? [utf8ToHex("canTransferNFTCreateRole"), this.trueAsHex] : []),
            ...(options.canChangeOwner ? [utf8ToHex("canChangeOwner"), this.trueAsHex] : []),
            ...[utf8ToHex("canUpgrade"), utf8ToHex(String(options.canUpgrade).toLowerCase())],
            ...[utf8ToHex("canAddSpecialRoles"), utf8ToHex(String(options.canAddSpecialRoles).toLowerCase())]
        ];

        return new DraftTransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(ESDT_CONTRACT_ADDRESS),
            dataParts: dataParts,
            gasLimit: this.config.gasLimitIssue,
            addDataMovementGas: true,
            amount: this.config.issueCost
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
    }): DraftTransaction {
        this.notifyAboutUnsettingBurnRoleGlobally();

        const dataParts = [
            "issueNonFungible",
            utf8ToHex(options.tokenName),
            utf8ToHex(options.tokenTicker),
            ...(options.canFreeze ? [utf8ToHex("canFreeze"), this.trueAsHex] : []),
            ...(options.canWipe ? [utf8ToHex("canWipe"), this.trueAsHex] : []),
            ...(options.canPause ? [utf8ToHex("canPause"), this.trueAsHex] : []),
            ...(options.canTransferNFTCreateRole ? [utf8ToHex("canTransferNFTCreateRole"), this.trueAsHex] : []),
            ...(options.canChangeOwner ? [utf8ToHex("canChangeOwner"), this.trueAsHex] : []),
            ...[utf8ToHex("canUpgrade"), utf8ToHex(String(options.canUpgrade).toLowerCase())],
            ...[utf8ToHex("canAddSpecialRoles"), utf8ToHex(String(options.canAddSpecialRoles).toLowerCase())]
        ];

        return new DraftTransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(ESDT_CONTRACT_ADDRESS),
            dataParts: dataParts,
            gasLimit: this.config.gasLimitIssue,
            addDataMovementGas: true,
            amount: this.config.issueCost
        }).build();
    }

    createTransactionForRegisteringMetaESDT(options: {
        sender: IAddress;
        tokenName: string;
        tokenTicker: string;
        numDecimals: BigNumber.Value,
        canFreeze: boolean;
        canWipe: boolean;
        canPause: boolean;
        canTransferNFTCreateRole: boolean;
        canChangeOwner: boolean;
        canUpgrade: boolean;
        canAddSpecialRoles: boolean;
    }): DraftTransaction {
        this.notifyAboutUnsettingBurnRoleGlobally();

        const dataParts = [
            "registerMetaESDT",
            utf8ToHex(options.tokenName),
            utf8ToHex(options.tokenTicker),
            bigIntToHex(options.numDecimals),
            ...(options.canFreeze ? [utf8ToHex("canFreeze"), this.trueAsHex] : []),
            ...(options.canWipe ? [utf8ToHex("canWipe"), this.trueAsHex] : []),
            ...(options.canPause ? [utf8ToHex("canPause"), this.trueAsHex] : []),
            ...(options.canTransferNFTCreateRole ? [utf8ToHex("canTransferNFTCreateRole"), this.trueAsHex] : []),
            ...(options.canChangeOwner ? [utf8ToHex("canChangeOwner"), this.trueAsHex] : []),
            ...(options.canUpgrade ? [utf8ToHex("canUpgrade"), this.trueAsHex] : []),
            ...(options.canAddSpecialRoles ? [utf8ToHex("canAddSpecialRoles"), this.trueAsHex] : []),
        ];

        return new DraftTransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(ESDT_CONTRACT_ADDRESS),
            dataParts: dataParts,
            gasLimit: this.config.gasLimitIssue,
            addDataMovementGas: true,
            amount: this.config.issueCost
        }).build();
    }

    createTransactionForRegisteringAndSettingRoles(options: {
        sender: IAddress;
        tokenName: string;
        tokenTicker: string;
        tokenType: RegisterAndSetAllRolesTokenType;
        numDecimals: BigNumber.Value;
    }): DraftTransaction {
        this.notifyAboutUnsettingBurnRoleGlobally();

        const dataParts = [
            "registerAndSetAllRoles",
            utf8ToHex(options.tokenName),
            utf8ToHex(options.tokenTicker),
            utf8ToHex(options.tokenType),
            bigIntToHex(options.numDecimals)
        ];

        return new DraftTransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(ESDT_CONTRACT_ADDRESS),
            dataParts: dataParts,
            gasLimit: this.config.gasLimitIssue,
            addDataMovementGas: true,
            amount: this.config.issueCost
        }).build();
    }

    createTransactionForSettingBurnRoleGlobally(options: {
        sender: IAddress,
        tokenIdentifier: string
    }): DraftTransaction {
        const dataParts = [
            "setBurnRoleGlobally",
            utf8ToHex(options.tokenIdentifier)
        ];

        return new DraftTransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(ESDT_CONTRACT_ADDRESS),
            dataParts: dataParts,
            gasLimit: this.config.gasLimitToggleBurnRoleGlobally,
            addDataMovementGas: true
        }).build();
    }

    createTransactionForUnsettingBurnRoleGlobally(options: {
        sender: IAddress,
        tokenIdentifier: string
    }): DraftTransaction {
        const dataParts = [
            "unsetBurnRoleGlobally",
            utf8ToHex(options.tokenIdentifier)
        ];

        return new DraftTransactionBuilder({
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
    }): DraftTransaction {
        const dataParts = [
            "setSpecialRole",
            utf8ToHex(options.tokenIdentifier),
            addressToHex(options.user),
            ...(options.addRoleLocalMint ? [utf8ToHex("ESDTRoleLocalMint")] : []),
            ...(options.addRoleLocalBurn ? [utf8ToHex("ESDTRoleLocalBurn")] : []),
        ];

        return new DraftTransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(ESDT_CONTRACT_ADDRESS),
            dataParts: dataParts,
            gasLimit: this.config.gasLimitSetSpecialRole,
            addDataMovementGas: true
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
    }): DraftTransaction {
        const dataParts = [
            "setSpecialRole",
            utf8ToHex(options.tokenIdentifier),
            addressToHex(options.user),
            ...(options.addRoleNFTCreate ? [utf8ToHex("ESDTRoleNFTCreate")] : []),
            ...(options.addRoleNFTBurn ? [utf8ToHex("ESDTRoleNFTBurn")] : []),
            ...(options.addRoleNFTAddQuantity ? [utf8ToHex("ESDTRoleNFTAddQuantity")] : []),
            ...(options.addRoleESDTTransferRole ? [utf8ToHex("ESDTTransferRole")] : []),
        ];

        return new DraftTransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(ESDT_CONTRACT_ADDRESS),
            dataParts: dataParts,
            gasLimit: this.config.gasLimitSetSpecialRole,
            addDataMovementGas: true
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
    }): DraftTransaction {
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
    }): DraftTransaction {
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

        return new DraftTransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(ESDT_CONTRACT_ADDRESS),
            dataParts: dataParts,
            gasLimit: this.config.gasLimitSetSpecialRole,
            addDataMovementGas: true
        }).build();
    }

    createTransactionForCreatingNFT(options: {
        sender: IAddress;
        tokenIdentifier: string;
        initialQuantity: BigNumber.Value;
        name: string;
        royalties: number;
        hash: string;
        attributes: Uint8Array;
        uris: string[];
    }): DraftTransaction {
        const dataParts = [
            "ESDTNFTCreate",
            utf8ToHex(options.tokenIdentifier),
            bigIntToHex(options.initialQuantity),
            utf8ToHex(options.name),
            bigIntToHex(options.royalties),
            utf8ToHex(options.hash),
            byteArrayToHex(options.attributes),
            ...options.uris.map(utf8ToHex),
        ];

        // Note that the following is an approximation (a reasonable one):
        const nftData = options.name + options.hash + options.attributes + options.uris.join("");
        const storageGasLimit = new BigNumber(this.config.gasLimitPerByte).multipliedBy(nftData.length);

        return new DraftTransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: dataParts,
            gasLimit: new BigNumber(this.config.gasLimitEsdtNftCreate).plus(storageGasLimit),
            addDataMovementGas: true
        }).build();
    }

    createTransactionForPausing(options: {
        sender: IAddress;
        tokenIdentifier: string;
    }): DraftTransaction {
        const dataParts = [
            "pause",
            utf8ToHex(options.tokenIdentifier)
        ];

        return new DraftTransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitPausing,
            addDataMovementGas: true
        }).build();
    }

    createTransactionForUnpausing(options: {
        sender: IAddress;
        tokenIdentifier: string;
    }): DraftTransaction {
        const dataParts = [
            "unPause",
            utf8ToHex(options.tokenIdentifier)
        ];

        return new DraftTransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitPausing,
            addDataMovementGas: true
        }).build();
    }

    createTransactionForFreezing(options: {
        sender: IAddress;
        user: IAddress;
        tokenIdentifier: string;
    }): DraftTransaction {
        const dataParts = [
            "freeze",
            utf8ToHex(options.tokenIdentifier),
            addressToHex(options.user)
        ];

        return new DraftTransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitFreezing,
            addDataMovementGas: true
        }).build();
    }

    createTransactionForUnfreezing(options: {
        sender: IAddress;
        user: IAddress;
        tokenIdentifier: string;
    }): DraftTransaction {
        const dataParts = [
            "UnFreeze",
            utf8ToHex(options.tokenIdentifier),
            addressToHex(options.user)
        ];

        return new DraftTransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitFreezing,
            addDataMovementGas: true
        }).build();
    }

    createTransactionForWiping(options: {
        sender: IAddress;
        user: IAddress;
        tokenIdentifier: string;
    }): DraftTransaction {
        const dataParts = [
            "wipe",
            utf8ToHex(options.tokenIdentifier),
            addressToHex(options.user)
        ];

        return new DraftTransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitWiping,
            addDataMovementGas: true
        }).build();
    }

    createTransactionForLocalMint(options: {
        sender: IAddress;
        tokenIdentifier: string;
        supplyToMint: BigNumber.Value;
    }): DraftTransaction {
        const dataParts = [
            "ESDTLocalMint",
            utf8ToHex(options.tokenIdentifier),
            bigIntToHex(options.supplyToMint),
        ];

        return new DraftTransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitEsdtLocalMint,
            addDataMovementGas: true
        }).build();
    }

    createTransactionForLocalBurning(options: {
        sender: IAddress;
        tokenIdentifier: string;
        supplyToBurn: BigNumber.Value;
    }): DraftTransaction {
        const dataParts = [
            "ESDTLocalBurn",
            utf8ToHex(options.tokenIdentifier),
            bigIntToHex(options.supplyToBurn),
        ];

        return new DraftTransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitEsdtLocalBurn,
            addDataMovementGas: true
        }).build();
    }

    createTransactionForUpdatingAttributes(options: {
        sender: IAddress;
        tokenIdentifier: string;
        tokenNonce: BigNumber.Value;
        attributes: Uint8Array
    }): DraftTransaction {
        const dataParts = [
            "ESDTNFTUpdateAttributes",
            utf8ToHex(options.tokenIdentifier),
            bigIntToHex(options.tokenNonce),
            byteArrayToHex(options.attributes),
        ];

        return new DraftTransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitEsdtNftUpdateAttributes,
            addDataMovementGas: true
        }).build();
    }

    createTransactionForAddingQuantity(options: {
        sender: IAddress;
        tokenIdentifier: string;
        tokenNonce: BigNumber.Value;
        quantityToAdd: BigNumber.Value
    }): DraftTransaction {
        const dataParts = [
            "ESDTNFTAddQuantity",
            utf8ToHex(options.tokenIdentifier),
            bigIntToHex(options.tokenNonce),
            bigIntToHex(options.quantityToAdd)
        ];

        return new DraftTransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitEsdtNftAddQuantity,
            addDataMovementGas: true
        }).build();
    }

    createTransactionForBurningQuantity(options: {
        sender: IAddress;
        tokenIdentifier: string;
        tokenNonce: BigNumber.Value;
        quantityToBurn: BigNumber.Value
    }): DraftTransaction {
        const dataParts = [
            "ESDTNFTBurn",
            utf8ToHex(options.tokenIdentifier),
            bigIntToHex(options.tokenNonce),
            bigIntToHex(options.quantityToBurn)
        ];

        return new DraftTransactionBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.sender,
            dataParts: dataParts,
            gasLimit: this.config.gasLimitEsdtNftBurn,
            addDataMovementGas: true
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
