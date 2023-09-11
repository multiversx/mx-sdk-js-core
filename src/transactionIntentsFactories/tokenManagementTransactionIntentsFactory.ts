import BigNumber from "bignumber.js";
import { TransactionIntent } from "../transactionIntent";
import { TransactionIntentBuilder } from "./transactionIntentBuilder";
import { IAddress } from "../interface";
import { utf8ToHex, bigIntToHex, addressToHex } from "../utils.codec";
import { ESDT_CONTRACT_ADDRESS } from "../constants";
import { Address } from "../address";
import { Logger } from "../logger";

interface Config {
    chainID: string
    minGasLimit: BigNumber.Value
    gasLimitPerByte: BigNumber.Value
    gasLimitIssue: BigNumber.Value
    gasLimitToggleBurnRoleGlobally: BigNumber.Value
    gasLimitESDTLocalMint: BigNumber.Value
    gasLimitESDTLocalBurn: BigNumber.Value
    gasLimitSetSpecialRole: BigNumber.Value
    gasLimitPausing: BigNumber.Value
    gasLimitFreezing: BigNumber.Value
    gasLimitWiping: BigNumber.Value
    gasLimitESDTNFTCreate: BigNumber.Value
    gasLimitESDTNFTUpdateAttributes: BigNumber.Value
    gasLimitESDTNFTAddQuantity: BigNumber.Value
    gasLimitESDTNFTBurn: BigNumber.Value
    gasLimitStorePerByte: BigNumber.Value
    issueCost: BigNumber.Value
    esdtContractAddress: IAddress
}

type RegisterAndSetAllRolesTokenType = "NFT" | "SFT" | "META" | "FNG";

export class TokenManagementTransactionIntentsFactory {
    private readonly config: Config;
    private readonly trueAsHex: string;

    constructor(config: Config) {
        this.config = config;
        this.trueAsHex = utf8ToHex("true");
    }

    createTransactionIntentForIssuingFungible(options: {
        sender: IAddress,
        tokenName: string,
        tokenTicker: string,
        initialSupply: BigNumber.Value,
        numDecimals: BigNumber.Value,
        canFreeze: boolean,
        canWipe: boolean,
        canPause: boolean,
        canChangeOwner: boolean,
        canUpgrade: boolean,
        canAddSpecialRoles: boolean
    }): TransactionIntent {
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
            ...(options.canChangeOwner ? [utf8ToHex("canChangeOwner"), this.trueAsHex] : []),
            ...(options.canUpgrade ? [utf8ToHex("canUpgrade"), this.trueAsHex] : []),
            ...(options.canAddSpecialRoles ? [utf8ToHex("canAddSpecialRoles"), this.trueAsHex] : []),
        ];

        return new TransactionIntentBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(ESDT_CONTRACT_ADDRESS),
            dataParts: dataParts,
            executionGasLimit: this.config.gasLimitIssue,
            value: this.config.issueCost
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

    createTransactionIntentForIssuingSemiFungible(options: {
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
    }): TransactionIntent {
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
            ...(options.canUpgrade ? [utf8ToHex("canUpgrade"), this.trueAsHex] : []),
            ...(options.canAddSpecialRoles ? [utf8ToHex("canAddSpecialRoles"), this.trueAsHex] : []),
        ];

        return new TransactionIntentBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(ESDT_CONTRACT_ADDRESS),
            dataParts: dataParts,
            executionGasLimit: this.config.gasLimitIssue,
            value: this.config.issueCost
        }).build();
    }

    createTransactionIntentForIssuingNonFungible(options: {
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
    }): TransactionIntent {
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
            ...(options.canUpgrade ? [utf8ToHex("canUpgrade"), this.trueAsHex] : []),
            ...(options.canAddSpecialRoles ? [utf8ToHex("canAddSpecialRoles"), this.trueAsHex] : []),
        ];

        return new TransactionIntentBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(ESDT_CONTRACT_ADDRESS),
            dataParts: dataParts,
            executionGasLimit: this.config.gasLimitIssue,
            value: this.config.issueCost
        }).build();
    }

    createTransactionIntentForRegisteringMetaEsdt(options: {
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
    }): TransactionIntent {
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

        return new TransactionIntentBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(ESDT_CONTRACT_ADDRESS),
            dataParts: dataParts,
            executionGasLimit: this.config.gasLimitIssue,
            value: this.config.issueCost
        }).build();
    }

    createTransactionIntentForRegisteringAndSettingRoles(options: {
        sender: IAddress;
        tokenName: string;
        tokenTicker: string;
        tokenType: RegisterAndSetAllRolesTokenType;
        numDecimals: BigNumber.Value;
    }): TransactionIntent {
        this.notifyAboutUnsettingBurnRoleGlobally();

        const dataParts = [
            "registerAndSetAllRoles",
            utf8ToHex(options.tokenName),
            utf8ToHex(options.tokenTicker),
            utf8ToHex(options.tokenType),
            bigIntToHex(options.numDecimals)
        ];

        return new TransactionIntentBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(ESDT_CONTRACT_ADDRESS),
            dataParts: dataParts,
            executionGasLimit: this.config.gasLimitIssue,
            value: this.config.issueCost
        }).build();
    }

    createTransactionIntentForSettingBurnRoleGlobally(options: {
        sender: IAddress,
        tokenIdentifier: string
    }): TransactionIntent {
        const dataParts = [
            "setBurnRoleGlobally",
            utf8ToHex(options.tokenIdentifier)
        ];

        return new TransactionIntentBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(ESDT_CONTRACT_ADDRESS),
            dataParts: dataParts,
            executionGasLimit: this.config.gasLimitToggleBurnRoleGlobally
        }).build();
    }

    createTransactionIntentForUnsettingBurnRoleGlobally(options: {
        sender: IAddress,
        tokenIdentifier: string
    }): TransactionIntent {
        const dataParts = [
            "unsetBurnRoleGlobally",
            utf8ToHex(options.tokenIdentifier)
        ];

        return new TransactionIntentBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(ESDT_CONTRACT_ADDRESS),
            dataParts: dataParts,
            executionGasLimit: this.config.gasLimitToggleBurnRoleGlobally
        }).build();
    }

    createTransactionIntentForSettingSpecialRoleOnFungibleToken(options: {
        sender: IAddress;
        user: IAddress;
        tokenIdentifier: string;
        addRoleLocalMint: boolean;
        addRoleLocalBurn: boolean;
    }): TransactionIntent {
        const dataParts = [
            "setSpecialRole",
            utf8ToHex(options.tokenIdentifier),
            addressToHex(options.user),
            ...(options.addRoleLocalMint ? [utf8ToHex("ESDTRoleLocalMint")] : []),
            ...(options.addRoleLocalBurn ? [utf8ToHex("ESDTRoleLocalBurn")] : []),
        ];

        return new TransactionIntentBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(ESDT_CONTRACT_ADDRESS),
            dataParts: dataParts,
            executionGasLimit: this.config.gasLimitSetSpecialRole
        }).build();
    }
}
