import BigNumber from "bignumber.js";
import { ARGUMENTS_SEPARATOR, ESDT_CONTRACT_ADDRESS } from "../constants";
import { IAddress, ITransactionPayload } from "../interface";
import { Logger } from "../logger";
import { addressToHex, bigIntToHex, byteArrayToHex, utf8ToHex } from "../utils.codec";
import { TransactionNext } from "../transaction";
import { TransactionPayload } from "../transactionPayload";

interface Config {
    chainID: string;
    minGasLimit: BigNumber.Value;
    gasLimitPerByte: BigNumber.Value;
    gasLimitIssue: BigNumber.Value;
    gasLimitToggleBurnRoleGlobally: BigNumber.Value;
    gasLimitEsdtLocalMint: BigNumber.Value;
    gasLimitEsdtLocalBurn: BigNumber.Value;
    gasLimitSetSpecialRole: BigNumber.Value;
    gasLimitPausing: BigNumber.Value;
    gasLimitFreezing: BigNumber.Value;
    gasLimitWiping: BigNumber.Value;
    gasLimitEsdtNftCreate: BigNumber.Value;
    gasLimitEsdtNftUpdateAttributes: BigNumber.Value;
    gasLimitEsdtNftAddQuantity: BigNumber.Value;
    gasLimitEsdtNftBurn: BigNumber.Value;
    gasLimitStorePerByte: BigNumber.Value;
    issueCost: BigNumber.Value;
}

type RegisterAndSetAllRolesTokenType = "NFT" | "SFT" | "META" | "FNG";

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
        initialSupply: BigNumber.Value;
        numDecimals: BigNumber.Value;
        canFreeze: boolean;
        canWipe: boolean;
        canPause: boolean;
        canChangeOwner: boolean;
        canUpgrade: boolean;
        canAddSpecialRoles: boolean;
    }): TransactionNext {
        this.notifyAboutUnsettingBurnRoleGlobally();

        const dataParts: string[] = [
            "issue",
            utf8ToHex(options.tokenName),
            utf8ToHex(options.tokenTicker),
            bigIntToHex(options.initialSupply),
            bigIntToHex(options.numDecimals),
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
        const data = this.buildTransactionPayload(dataParts);
        const extraGasLimit: BigNumber = new BigNumber(this.config.gasLimitIssue);
        const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: ESDT_CONTRACT_ADDRESS,
            data: data.valueOf(),
            gasLimit: gasLimit,
            value: this.config.issueCost,
            chainID: this.config.chainID
        });
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
    }): TransactionNext {
        this.notifyAboutUnsettingBurnRoleGlobally();

        const dataParts: string[] = [
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
        const data = this.buildTransactionPayload(dataParts);
        const extraGasLimit: BigNumber = new BigNumber(this.config.gasLimitIssue);
        const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: ESDT_CONTRACT_ADDRESS,
            data: data.valueOf(),
            gasLimit: gasLimit,
            value: this.config.issueCost,
            chainID: this.config.chainID
        });
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
    }): TransactionNext {
        this.notifyAboutUnsettingBurnRoleGlobally();

        const dataParts: string[] = [
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
        const data = this.buildTransactionPayload(dataParts);
        const extraGasLimit: BigNumber = new BigNumber(this.config.gasLimitIssue);
        const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: ESDT_CONTRACT_ADDRESS,
            data: data.valueOf(),
            gasLimit: gasLimit,
            value: this.config.issueCost,
            chainID: this.config.chainID
        });
    }

    createTransactionForRegisteringMetaESDT(options: {
        sender: IAddress;
        tokenName: string;
        tokenTicker: string;
        numDecimals: BigNumber.Value;
        canFreeze: boolean;
        canWipe: boolean;
        canPause: boolean;
        canTransferNFTCreateRole: boolean;
        canChangeOwner: boolean;
        canUpgrade: boolean;
        canAddSpecialRoles: boolean;
    }): TransactionNext {
        this.notifyAboutUnsettingBurnRoleGlobally();

        const dataParts: string[] = [
            "registerMetaESDT",
            utf8ToHex(options.tokenName),
            utf8ToHex(options.tokenTicker),
            bigIntToHex(options.numDecimals),
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
        const data = this.buildTransactionPayload(dataParts);
        const extraGasLimit: BigNumber = new BigNumber(this.config.gasLimitIssue);
        const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: ESDT_CONTRACT_ADDRESS,
            data: data.valueOf(),
            gasLimit: gasLimit,
            value: this.config.issueCost,
            chainID: this.config.chainID
        });
    }

    createTransactionForRegisteringAndSettingRoles(options: {
        sender: IAddress;
        tokenName: string;
        tokenTicker: string;
        tokenType: RegisterAndSetAllRolesTokenType;
        numDecimals: BigNumber.Value;
    }): TransactionNext {
        this.notifyAboutUnsettingBurnRoleGlobally();

        const dataParts: string[] = [
            "registerAndSetAllRoles",
            utf8ToHex(options.tokenName),
            utf8ToHex(options.tokenTicker),
            utf8ToHex(options.tokenType),
            bigIntToHex(options.numDecimals),
        ];
        const data = this.buildTransactionPayload(dataParts);
        const extraGasLimit: BigNumber = new BigNumber(this.config.gasLimitIssue);
        const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: ESDT_CONTRACT_ADDRESS,
            data: data.valueOf(),
            gasLimit: gasLimit,
            value: this.config.issueCost,
            chainID: this.config.chainID
        });
    }

    createTransactionForSettingBurnRoleGlobally(options: {
        sender: IAddress;
        tokenIdentifier: string;
    }): TransactionNext {
        const dataParts: string[] = ["setBurnRoleGlobally", utf8ToHex(options.tokenIdentifier)];
        const data = this.buildTransactionPayload(dataParts);
        const extraGasLimit: BigNumber = new BigNumber(this.config.gasLimitToggleBurnRoleGlobally);
        const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: ESDT_CONTRACT_ADDRESS,
            data: data.valueOf(),
            gasLimit: gasLimit,
            chainID: this.config.chainID
        });
    }

    createTransactionForUnsettingBurnRoleGlobally(options: {
        sender: IAddress;
        tokenIdentifier: string;
    }): TransactionNext {
        const dataParts: string[] = ["unsetBurnRoleGlobally", utf8ToHex(options.tokenIdentifier)];
        const data = this.buildTransactionPayload(dataParts);
        const extraGasLimit: BigNumber = new BigNumber(this.config.gasLimitToggleBurnRoleGlobally);
        const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: ESDT_CONTRACT_ADDRESS,
            data: data.valueOf(),
            gasLimit: gasLimit,
            chainID: this.config.chainID
        });
    }

    createTransactionForSettingSpecialRoleOnFungibleToken(options: {
        sender: IAddress;
        user: IAddress;
        tokenIdentifier: string;
        addRoleLocalMint: boolean;
        addRoleLocalBurn: boolean;
    }): TransactionNext {
        const dataParts: string[] = [
            "setSpecialRole",
            utf8ToHex(options.tokenIdentifier),
            addressToHex(options.user),
            ...(options.addRoleLocalMint ? [utf8ToHex("ESDTRoleLocalMint")] : []),
            ...(options.addRoleLocalBurn ? [utf8ToHex("ESDTRoleLocalBurn")] : []),
        ];
        const data = this.buildTransactionPayload(dataParts);
        const extraGasLimit: BigNumber = new BigNumber(this.config.gasLimitSetSpecialRole);
        const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: ESDT_CONTRACT_ADDRESS,
            data: data.valueOf(),
            gasLimit: gasLimit,
            chainID: this.config.chainID
        });
    }

    createTransactionForSettingSpecialRoleOnSemiFungibleToken(options: {
        sender: IAddress;
        user: IAddress;
        tokenIdentifier: string;
        addRoleNFTCreate: boolean;
        addRoleNFTBurn: boolean;
        addRoleNFTAddQuantity: boolean;
        addRoleESDTTransferRole: boolean;
    }): TransactionNext {
        const dataParts: string[] = [
            "setSpecialRole",
            utf8ToHex(options.tokenIdentifier),
            addressToHex(options.user),
            ...(options.addRoleNFTCreate ? [utf8ToHex("ESDTRoleNFTCreate")] : []),
            ...(options.addRoleNFTBurn ? [utf8ToHex("ESDTRoleNFTBurn")] : []),
            ...(options.addRoleNFTAddQuantity ? [utf8ToHex("ESDTRoleNFTAddQuantity")] : []),
            ...(options.addRoleESDTTransferRole ? [utf8ToHex("ESDTTransferRole")] : []),
        ];
        const data = this.buildTransactionPayload(dataParts);
        const extraGasLimit: BigNumber = new BigNumber(this.config.gasLimitSetSpecialRole);
        const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: ESDT_CONTRACT_ADDRESS,
            data: data.valueOf(),
            gasLimit: gasLimit,
            chainID: this.config.chainID
        });
    }

    createTransactionForSettingSpecialRoleOnMetaESDT(options: {
        sender: IAddress;
        user: IAddress;
        tokenIdentifier: string;
        addRoleNFTCreate: boolean;
        addRoleNFTBurn: boolean;
        addRoleNFTAddQuantity: boolean;
        addRoleESDTTransferRole: boolean;
    }): TransactionNext {
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
    }): TransactionNext {
        const dataParts: string[] = [
            "setSpecialRole",
            utf8ToHex(options.tokenIdentifier),
            addressToHex(options.user),
            ...(options.addRoleNFTCreate ? [utf8ToHex("ESDTRoleNFTCreate")] : []),
            ...(options.addRoleNFTBurn ? [utf8ToHex("ESDTRoleNFTBurn")] : []),
            ...(options.addRoleNFTUpdateAttributes ? [utf8ToHex("ESDTRoleNFTUpdateAttributes")] : []),
            ...(options.addRoleNFTAddURI ? [utf8ToHex("ESDTRoleNFTAddURI")] : []),
            ...(options.addRoleESDTTransferRole ? [utf8ToHex("ESDTTransferRole")] : []),
        ];
        const data = this.buildTransactionPayload(dataParts);
        const extraGasLimit: BigNumber = new BigNumber(this.config.gasLimitSetSpecialRole);
        const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: ESDT_CONTRACT_ADDRESS,
            data: data.valueOf(),
            gasLimit: gasLimit,
            chainID: this.config.chainID
        });
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
    }): TransactionNext {
        const dataParts: string[] = [
            "ESDTNFTCreate",
            utf8ToHex(options.tokenIdentifier),
            bigIntToHex(options.initialQuantity),
            utf8ToHex(options.name),
            bigIntToHex(options.royalties),
            utf8ToHex(options.hash),
            byteArrayToHex(options.attributes),
            ...options.uris.map(utf8ToHex),
        ];
        const data = this.buildTransactionPayload(dataParts);

        // Note that the following is an approximation (a reasonable one):
        const nftData = options.name + options.hash + options.attributes + options.uris.join("");
        const storageGasLimit = new BigNumber(this.config.gasLimitPerByte).multipliedBy(nftData.length);
        const extraGasLimit: BigNumber = new BigNumber(this.config.gasLimitEsdtNftCreate).plus(storageGasLimit);
        const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: options.sender.bech32(),
            data: data.valueOf(),
            gasLimit: gasLimit,
            chainID: this.config.chainID
        });
    }

    createTransactionForPausing(options: { 
        sender: IAddress; 
        tokenIdentifier: string 
    }): TransactionNext {
        const dataParts: string[] = ["pause", utf8ToHex(options.tokenIdentifier)];
        const data = this.buildTransactionPayload(dataParts);
        const extraGasLimit: BigNumber = new BigNumber(this.config.gasLimitPausing);
        const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: options.sender.bech32(),
            data: data.valueOf(),
            gasLimit: gasLimit,
            chainID: this.config.chainID
        });
    }

    createTransactionForUnpausing(options: {
        sender: IAddress; 
        tokenIdentifier: string 
    }): TransactionNext {
        const dataParts: string[] = ["unPause", utf8ToHex(options.tokenIdentifier)];
        const data = this.buildTransactionPayload(dataParts);
        const extraGasLimit: BigNumber = new BigNumber(this.config.gasLimitPausing);
        const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: options.sender.bech32(),
            data: data.valueOf(),
            gasLimit: gasLimit,
            chainID: this.config.chainID
        });
    }

    createTransactionForFreezing(options: {
        sender: IAddress;
        user: IAddress;
        tokenIdentifier: string;
    }): TransactionNext {
        const dataParts: string[] = ["freeze", utf8ToHex(options.tokenIdentifier), addressToHex(options.user)];
        const data = this.buildTransactionPayload(dataParts);
        const extraGasLimit: BigNumber = new BigNumber(this.config.gasLimitFreezing);
        const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: options.sender.bech32(),
            data: data.valueOf(),
            gasLimit: gasLimit,
            chainID: this.config.chainID
        });
    }

    createTransactionForUnfreezing(options: {
        sender: IAddress;
        user: IAddress;
        tokenIdentifier: string;
    }): TransactionNext {
        const dataParts: string[] = ["UnFreeze", utf8ToHex(options.tokenIdentifier), addressToHex(options.user)];
        const data = this.buildTransactionPayload(dataParts);
        const extraGasLimit: BigNumber = new BigNumber(this.config.gasLimitFreezing);
        const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: options.sender.bech32(),
            data: data.valueOf(),
            gasLimit: gasLimit,
            chainID: this.config.chainID
        });
    }

    createTransactionForWiping(options: {
        sender: IAddress;
        user: IAddress;
        tokenIdentifier: string;
    }): TransactionNext {
        const dataParts: string[] = ["wipe", utf8ToHex(options.tokenIdentifier), addressToHex(options.user)];
        const data = this.buildTransactionPayload(dataParts);
        const extraGasLimit: BigNumber = new BigNumber(this.config.gasLimitWiping);
        const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: options.sender.bech32(),
            data: data.valueOf(),
            gasLimit: gasLimit,
            chainID: this.config.chainID
        });
    }

    createTransactionForLocalMint(options: {
        sender: IAddress;
        tokenIdentifier: string;
        supplyToMint: BigNumber.Value;
    }): TransactionNext {
        const dataParts: string[] = ["ESDTLocalMint", utf8ToHex(options.tokenIdentifier), bigIntToHex(options.supplyToMint)];
        const data = this.buildTransactionPayload(dataParts);
        const extraGasLimit: BigNumber = new BigNumber(this.config.gasLimitEsdtLocalMint);
        const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: options.sender.bech32(),
            data: data.valueOf(),
            gasLimit: gasLimit,
            chainID: this.config.chainID
        });
    }

    createTransactionForLocalBurning(options: {
        sender: IAddress;
        tokenIdentifier: string;
        supplyToBurn: BigNumber.Value;
    }): TransactionNext {
        const dataParts: string[] = ["ESDTLocalBurn", utf8ToHex(options.tokenIdentifier), bigIntToHex(options.supplyToBurn)];
        const data = this.buildTransactionPayload(dataParts);
        const extraGasLimit: BigNumber = new BigNumber(this.config.gasLimitEsdtLocalBurn);
        const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: options.sender.bech32(),
            data: data.valueOf(),
            gasLimit: gasLimit,
            chainID: this.config.chainID
        });
    }

    createTransactionForUpdatingAttributes(options: {
        sender: IAddress;
        tokenIdentifier: string;
        tokenNonce: BigNumber.Value;
        attributes: Uint8Array;
    }): TransactionNext {
        const dataParts: string[] = [
            "ESDTNFTUpdateAttributes",
            utf8ToHex(options.tokenIdentifier),
            bigIntToHex(options.tokenNonce),
            byteArrayToHex(options.attributes),
        ];
        const data = this.buildTransactionPayload(dataParts);
        const extraGasLimit: BigNumber = new BigNumber(this.config.gasLimitEsdtNftUpdateAttributes);
        const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: options.sender.bech32(),
            data: data.valueOf(),
            gasLimit: gasLimit,
            chainID: this.config.chainID
        });
    }

    createTransactionForAddingQuantity(options: {
        sender: IAddress;
        tokenIdentifier: string;
        tokenNonce: BigNumber.Value;
        quantityToAdd: BigNumber.Value;
    }): TransactionNext {
        const dataParts: string[] = [
            "ESDTNFTAddQuantity",
            utf8ToHex(options.tokenIdentifier),
            bigIntToHex(options.tokenNonce),
            bigIntToHex(options.quantityToAdd),
        ];
        const data = this.buildTransactionPayload(dataParts);
        const extraGasLimit: BigNumber = new BigNumber(this.config.gasLimitEsdtNftAddQuantity);
        const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: options.sender.bech32(),
            data: data.valueOf(),
            gasLimit: gasLimit,
            chainID: this.config.chainID
        });
    }

    createTransactionForBurningQuantity(options: {
        sender: IAddress;
        tokenIdentifier: string;
        tokenNonce: BigNumber.Value;
        quantityToBurn: BigNumber.Value;
    }): TransactionNext {
        const dataParts: string[] = [
            "ESDTNFTBurn",
            utf8ToHex(options.tokenIdentifier),
            bigIntToHex(options.tokenNonce),
            bigIntToHex(options.quantityToBurn),
        ];
        const data = this.buildTransactionPayload(dataParts);
        const extraGasLimit: BigNumber = new BigNumber(this.config.gasLimitEsdtNftBurn);
        const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: options.sender.bech32(),
            data: data.valueOf(),
            gasLimit: gasLimit,
            chainID: this.config.chainID
        });
    }

    private notifyAboutUnsettingBurnRoleGlobally() {
        Logger.info(`
==========
IMPORTANT!
==========
You are about to issue (register) a new token. This will set the role "ESDTRoleBurnForAll" (globally).
Once the token is registered, you can unset this role by calling "unsetBurnRoleGlobally" (in a separate transaction).`);
    }

    private buildTransactionPayload(dataParts: string[]): TransactionPayload {
        const data = dataParts.join(ARGUMENTS_SEPARATOR);
        return new TransactionPayload(data);
    }

    private computeGasLimit(providedGasLimit: BigNumber, payload: ITransactionPayload): BigNumber.Value {
        const dataMovementGas = new BigNumber(this.config.minGasLimit).plus(new BigNumber(this.config.gasLimitPerByte).multipliedBy(payload.length()));
        const gasLimit = dataMovementGas.plus(providedGasLimit);
        return gasLimit;
    }
}
