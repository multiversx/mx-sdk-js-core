import BigNumber from "bignumber.js";
import { ARGUMENTS_SEPARATOR, TRANSACTION_OPTIONS_DEFAULT, TRANSACTION_VERSION_DEFAULT } from "../constants";
import { Err } from "../errors";
import { IAddress, IChainID, IGasLimit, IGasPrice, INonce, ITransactionValue } from "../interface";
import { TransactionOptions, TransactionVersion } from "../networkParams";
import { Transaction } from "../transaction";
import { TransactionPayload } from "../transactionPayload";
import { addressToHex, bigIntToHex, utf8ToHex } from "./codec";

interface IConfig {
    chainID: IChainID;
    minGasPrice: IGasPrice;
    minGasLimit: IGasLimit;
    gasLimitPerByte: IGasLimit;
    gasLimitIssue: IGasLimit;
    gasLimitESDTLocalMint: IGasLimit;
    gasLimitESDTLocalBurn: IGasLimit;
    gasLimitSetSpecialRole: IGasLimit;
    gasLimitPausing: IGasLimit;
    gasLimitFreezing: IGasLimit;
    gasLimitESDTNFTCreate: IGasLimit;
    gasLimitStorePerByte: IGasLimit;
    issueCost: BigNumber.Value;
    esdtContractAddress: IAddress;
}

interface IBaseArgs {
    nonce?: INonce;
    value?: ITransactionValue;
    gasPrice?: IGasPrice;
    gasLimit?: IGasLimit;
}

interface IIssueFungibleArgs extends IBaseArgs {
    issuer: IAddress;
    tokenName: string;
    tokenTicker: string;
    initialSupply: number;
    numDecimals: number;
    canFreeze: boolean;
    canWipe: boolean;
    canPause: boolean;
    canMint: boolean;
    canBurn: boolean;
    canChangeOwner: boolean;
    canUpgrade: boolean;
    canAddSpecialRoles: boolean;
}

interface IIssueSemiFungibleArgs extends IBaseArgs {
    issuer: IAddress;
    tokenName: string;
    tokenTicker: string;
    canFreeze: boolean;
    canWipe: boolean;
    canPause: boolean;
    canTransferNFTCreateRole: boolean;
    canChangeOwner: boolean;
    canUpgrade: boolean;
    canAddSpecialRoles: boolean;
}

interface IIssueNonFungibleArgs extends IIssueSemiFungibleArgs {
}

interface IRegisterMetaESDT extends IIssueSemiFungibleArgs {
    numDecimals: number;
}

interface IFungibleSetSpecialRoleArgs extends IBaseArgs {
    manager: IAddress;
    user: IAddress;
    tokenIdentifier: string;
    addRoleLocalMint: boolean;
    addRoleLocalBurn: boolean;
}

interface ISemiFungibleSetSpecialRoleArgs extends IBaseArgs {
    manager: IAddress;
    user: IAddress;
    tokenIdentifier: string;
    addRoleNFTCreate: boolean;
    addRoleNFTBurn: boolean;
    addRoleNFTAddQuantity: boolean;
    addRoleESDTTransferRole: boolean;
}

interface INonFungibleSetSpecialRoleArgs extends IBaseArgs {
    manager: IAddress;
    user: IAddress;
    tokenIdentifier: string;
    addRoleNFTCreate: boolean;
    addRoleNFTBurn: boolean;
    addRoleNFTUpdateAttributes: boolean;
    addRoleNFTAddURI: boolean;
    addRoleESDTTransferRole: boolean;
}

interface IESDTNFTCreateArgs extends IBaseArgs {
    creator: IAddress;
    tokenIdentifier: string;
    initialQuantity: number;
    name: string;
    royalties: number;
    hash: string;
    attributes: string;
    uris: string[];
}

interface IESDTPausingArgs extends IBaseArgs {
    manager: IAddress;
    tokenIdentifier: string;
    pause: boolean;
    unpause: boolean;
}

interface IESDTFreezingArgs extends IBaseArgs {
    manager: IAddress;
    user: IAddress;
    tokenIdentifier: string;
    freeze: boolean;
    unfreeze: boolean;
}

interface IESDTLocalMintArgs extends IBaseArgs {
    manager: IAddress;
    user: IAddress;
    tokenIdentifier: string;
    supplyToMint: BigNumber.Value
}

interface IESDTLocalBurnArgs extends IBaseArgs {
    manager: IAddress;
    user: IAddress;
    tokenIdentifier: string;
    supplyToBurn: BigNumber.Value
}

export class TokenOperationsFactory {
    private readonly config: IConfig;

    constructor(config: IConfig) {
        this.config = config;
    }

    issueFungible(args: IIssueFungibleArgs): Transaction {
        const trueAsHex = utf8ToHex("true");

        const parts = [
            "issue",
            utf8ToHex(args.tokenName),
            utf8ToHex(args.tokenTicker),
            bigIntToHex(args.initialSupply),
            bigIntToHex(args.numDecimals),
            ...(args.canFreeze ? [utf8ToHex("canFreeze"), trueAsHex] : []),
            ...(args.canWipe ? [utf8ToHex("canWipe"), trueAsHex] : []),
            ...(args.canPause ? [utf8ToHex("canPause"), trueAsHex] : []),
            ...(args.canMint ? [utf8ToHex("canMint"), trueAsHex] : []),
            ...(args.canBurn ? [utf8ToHex("canBurn"), trueAsHex] : []),
            ...(args.canChangeOwner ? [utf8ToHex("canChangeOwner"), trueAsHex] : []),
            ...(args.canUpgrade ? [utf8ToHex("canUpgrade"), trueAsHex] : []),
            ...(args.canAddSpecialRoles ? [utf8ToHex("canAddSpecialRoles"), trueAsHex] : []),
        ];

        return this.createTransaction({
            sender: args.issuer,
            receiver: this.config.esdtContractAddress,
            nonce: args.nonce,
            value: this.config.issueCost,
            gasPrice: args.gasPrice,
            gasLimitHint: args.gasLimit,
            executionGasLimit: this.config.gasLimitIssue,
            dataParts: parts
        });
    }

    issueSemiFungible(args: IIssueSemiFungibleArgs): Transaction {
        const trueAsHex = utf8ToHex("true");

        const parts = [
            "issueSemiFungible",
            utf8ToHex(args.tokenName),
            utf8ToHex(args.tokenTicker),
            ...(args.canFreeze ? [utf8ToHex("canFreeze"), trueAsHex] : []),
            ...(args.canWipe ? [utf8ToHex("canWipe"), trueAsHex] : []),
            ...(args.canPause ? [utf8ToHex("canPause"), trueAsHex] : []),
            ...(args.canTransferNFTCreateRole ? [utf8ToHex("canTransferNFTCreateRole"), trueAsHex] : []),
            ...(args.canChangeOwner ? [utf8ToHex("canChangeOwner"), trueAsHex] : []),
            ...(args.canUpgrade ? [utf8ToHex("canUpgrade"), trueAsHex] : []),
            ...(args.canAddSpecialRoles ? [utf8ToHex("canAddSpecialRoles"), trueAsHex] : []),
        ];

        return this.createTransaction({
            sender: args.issuer,
            receiver: this.config.esdtContractAddress,
            nonce: args.nonce,
            value: this.config.issueCost,
            gasPrice: args.gasPrice,
            gasLimitHint: args.gasLimit,
            executionGasLimit: this.config.gasLimitIssue,
            dataParts: parts
        });
    }

    issueNonFungible(args: IIssueNonFungibleArgs): Transaction {
        const trueAsHex = utf8ToHex("true");

        const parts = [
            "issueNonFungible",
            utf8ToHex(args.tokenName),
            utf8ToHex(args.tokenTicker),
            ...(args.canFreeze ? [utf8ToHex("canFreeze"), trueAsHex] : []),
            ...(args.canWipe ? [utf8ToHex("canWipe"), trueAsHex] : []),
            ...(args.canPause ? [utf8ToHex("canPause"), trueAsHex] : []),
            ...(args.canTransferNFTCreateRole ? [utf8ToHex("canTransferNFTCreateRole"), trueAsHex] : []),
            ...(args.canChangeOwner ? [utf8ToHex("canChangeOwner"), trueAsHex] : []),
            ...(args.canUpgrade ? [utf8ToHex("canUpgrade"), trueAsHex] : []),
            ...(args.canAddSpecialRoles ? [utf8ToHex("canAddSpecialRoles"), trueAsHex] : []),
        ];

        return this.createTransaction({
            sender: args.issuer,
            receiver: this.config.esdtContractAddress,
            nonce: args.nonce,
            value: this.config.issueCost,
            gasPrice: args.gasPrice,
            gasLimitHint: args.gasLimit,
            executionGasLimit: this.config.gasLimitIssue,
            dataParts: parts
        });
    }

    registerMetaESDT(args: IRegisterMetaESDT): Transaction {
        const trueAsHex = utf8ToHex("true");

        const parts = [
            "registerMetaESDT",
            utf8ToHex(args.tokenName),
            utf8ToHex(args.tokenTicker),
            bigIntToHex(args.numDecimals),
            ...(args.canFreeze ? [utf8ToHex("canFreeze"), trueAsHex] : []),
            ...(args.canWipe ? [utf8ToHex("canWipe"), trueAsHex] : []),
            ...(args.canPause ? [utf8ToHex("canPause"), trueAsHex] : []),
            ...(args.canTransferNFTCreateRole ? [utf8ToHex("canTransferNFTCreateRole"), trueAsHex] : []),
            ...(args.canChangeOwner ? [utf8ToHex("canChangeOwner"), trueAsHex] : []),
            ...(args.canUpgrade ? [utf8ToHex("canUpgrade"), trueAsHex] : []),
            ...(args.canAddSpecialRoles ? [utf8ToHex("canAddSpecialRoles"), trueAsHex] : []),
        ];

        return this.createTransaction({
            sender: args.issuer,
            receiver: this.config.esdtContractAddress,
            nonce: args.nonce,
            value: this.config.issueCost,
            gasPrice: args.gasPrice,
            gasLimitHint: args.gasLimit,
            executionGasLimit: this.config.gasLimitIssue,
            dataParts: parts
        });
    }

    setSpecialRoleOnFungible(args: IFungibleSetSpecialRoleArgs): Transaction {
        const parts = [
            "setSpecialRole",
            utf8ToHex(args.tokenIdentifier),
            addressToHex(args.user),
            ...(args.addRoleLocalMint ? [utf8ToHex("ESDTRoleLocalMint")] : []),
            ...(args.addRoleLocalBurn ? [utf8ToHex("ESDTRoleLocalBurn")] : []),
        ];

        return this.createTransaction({
            sender: args.manager,
            receiver: this.config.esdtContractAddress,
            nonce: args.nonce,
            gasPrice: args.gasPrice,
            gasLimitHint: args.gasLimit,
            executionGasLimit: this.config.gasLimitSetSpecialRole,
            dataParts: parts
        });
    }

    setSpecialRoleOnSemiFungible(args: ISemiFungibleSetSpecialRoleArgs): Transaction {
        const parts = [
            "setSpecialRole",
            utf8ToHex(args.tokenIdentifier),
            addressToHex(args.user),
            ...(args.addRoleNFTCreate ? [utf8ToHex("ESDTRoleNFTCreate")] : []),
            ...(args.addRoleNFTBurn ? [utf8ToHex("ESDTRoleNFTBurn")] : []),
            ...(args.addRoleNFTAddQuantity ? [utf8ToHex("ESDTRoleNFTAddQuantity")] : []),
            ...(args.addRoleESDTTransferRole ? [utf8ToHex("ESDTTransferRole")] : []),
        ];

        return this.createTransaction({
            sender: args.manager,
            receiver: this.config.esdtContractAddress,
            nonce: args.nonce,
            gasPrice: args.gasPrice,
            gasLimitHint: args.gasLimit,
            executionGasLimit: this.config.gasLimitSetSpecialRole,
            dataParts: parts
        });
    }

    setSpecialRoleOnNonFungible(args: INonFungibleSetSpecialRoleArgs): Transaction {
        const parts = [
            "setSpecialRole",
            utf8ToHex(args.tokenIdentifier),
            addressToHex(args.user),
            ...(args.addRoleNFTCreate ? [utf8ToHex("ESDTRoleNFTCreate")] : []),
            ...(args.addRoleNFTBurn ? [utf8ToHex("ESDTRoleNFTBurn")] : []),
            ...(args.addRoleNFTUpdateAttributes ? [utf8ToHex("ESDTRoleNFTUpdateAttributes")] : []),
            ...(args.addRoleNFTAddURI ? [utf8ToHex("ESDTRoleNFTAddURI")] : []),
            ...(args.addRoleESDTTransferRole ? [utf8ToHex("ESDTTransferRole")] : []),
        ];

        return this.createTransaction({
            sender: args.manager,
            receiver: this.config.esdtContractAddress,
            nonce: args.nonce,
            gasPrice: args.gasPrice,
            gasLimitHint: args.gasLimit,
            executionGasLimit: this.config.gasLimitSetSpecialRole,
            dataParts: parts
        });
    }

    nftCreate(args: IESDTNFTCreateArgs): Transaction {
        const parts = [
            "ESDTNFTCreate",
            utf8ToHex(args.tokenIdentifier),
            bigIntToHex(args.initialQuantity),
            utf8ToHex(args.name),
            bigIntToHex(args.royalties),
            utf8ToHex(args.hash),
            utf8ToHex(args.attributes),
            ...args.uris.map(utf8ToHex),
        ];

        // Question for review: is this the one to be considered as "NFT data"?
        const nftData = args.attributes + args.uris.join("");
        const storageGasLimit = nftData.length * this.config.gasLimitStorePerByte.valueOf();

        return this.createTransaction({
            sender: args.creator,
            receiver: args.creator,
            nonce: args.nonce,
            gasPrice: args.gasPrice,
            gasLimitHint: args.gasLimit,
            executionGasLimit: this.config.gasLimitESDTNFTCreate.valueOf() + storageGasLimit.valueOf(),
            dataParts: parts
        });
    }

    pause(args: IESDTPausingArgs): Transaction {
        if (args.pause == args.unpause) {
            throw new Err("Must set either 'pause' or 'unpause' (one and only one should be set).")
        }

        const parts = [
            args.pause ? "pause" : "unPause",
            utf8ToHex(args.tokenIdentifier)
        ];

        return this.createTransaction({
            sender: args.manager,
            receiver: this.config.esdtContractAddress,
            nonce: args.nonce,
            gasPrice: args.gasPrice,
            gasLimitHint: args.gasLimit,
            executionGasLimit: this.config.gasLimitPausing,
            dataParts: parts
        });
    }

    freeze(args: IESDTFreezingArgs): Transaction {
        if (args.freeze == args.unfreeze) {
            throw new Err("Must set either 'freeze' or 'unfreeze' (one and only one should be set).")
        }

        const parts = [
            args.freeze ? "freeze" : "unfreeze",
            utf8ToHex(args.tokenIdentifier),
            addressToHex(args.user)
        ];

        return this.createTransaction({
            sender: args.manager,
            receiver: this.config.esdtContractAddress,
            nonce: args.nonce,
            gasPrice: args.gasPrice,
            gasLimitHint: args.gasLimit,
            executionGasLimit: this.config.gasLimitFreezing,
            dataParts: parts
        });
    }

    localMint(args: IESDTLocalMintArgs): Transaction {
        const parts = [
            "ESDTLocalMint",
            utf8ToHex(args.tokenIdentifier),
            bigIntToHex(args.supplyToMint),
        ];

        return this.createTransaction({
            sender: args.manager,
            receiver: args.manager,
            nonce: args.nonce,
            gasPrice: args.gasPrice,
            gasLimitHint: args.gasLimit,
            executionGasLimit: this.config.gasLimitESDTLocalMint,
            dataParts: parts
        });
    }

    localBurn(args: IESDTLocalBurnArgs): Transaction {
        const parts = [
            "ESDTLocalBurn",
            utf8ToHex(args.tokenIdentifier),
            bigIntToHex(args.supplyToBurn),
        ];

        return this.createTransaction({
            sender: args.manager,
            receiver: args.manager,
            nonce: args.nonce,
            gasPrice: args.gasPrice,
            gasLimitHint: args.gasLimit,
            executionGasLimit: this.config.gasLimitESDTLocalBurn,
            dataParts: parts
        });
    }

    private createTransaction({ sender, receiver, nonce, value, gasPrice, gasLimitHint, executionGasLimit, dataParts }: {
        sender: IAddress;
        receiver: IAddress;
        nonce?: INonce;
        value?: ITransactionValue;
        gasPrice?: IGasPrice;
        gasLimitHint?: IGasLimit;
        executionGasLimit: IGasLimit;
        dataParts: string[];
    }): Transaction {
        const payload = this.buildTransactionPayload(dataParts);
        const gasLimit = gasLimitHint || this.computeGasLimit(payload, executionGasLimit);
        const version = new TransactionVersion(TRANSACTION_VERSION_DEFAULT);
        const options = new TransactionOptions(TRANSACTION_OPTIONS_DEFAULT);

        return new Transaction({
            chainID: this.config.chainID,
            sender: sender,
            receiver: receiver,
            gasLimit: gasLimit,
            gasPrice: gasPrice,
            nonce: nonce || 0,
            value: value || 0,
            data: payload,
            version: version,
            options: options
        });
    }

    private buildTransactionPayload(parts: string[]): TransactionPayload {
        const data = parts.join(ARGUMENTS_SEPARATOR);
        return new TransactionPayload(data);
    }

    private computeGasLimit(payload: TransactionPayload, executionGas: IGasLimit): IGasLimit {
        const dataMovementGas = this.config.minGasLimit.valueOf() + this.config.gasLimitPerByte.valueOf() * payload.length();
        return dataMovementGas + executionGas.valueOf();
    }
}
