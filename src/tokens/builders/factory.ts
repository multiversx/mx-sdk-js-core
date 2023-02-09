import BigNumber from "bignumber.js";
import { ARGUMENTS_SEPARATOR, TRANSACTION_OPTIONS_DEFAULT, TRANSACTION_VERSION_DEFAULT } from "../../constants";
import { Err } from "../../errors";
import { IAddress, IChainID, IGasLimit, IGasPrice, INonce, ITransactionValue } from "../../interface";
import { TransactionOptions, TransactionVersion } from "../../networkParams";
import { Transaction } from "../../transaction";
import { TransactionPayload } from "../../transactionPayload";
import { addressToHex, bigIntToHex, utf8ToHex } from "../codec";

interface ITokensFactoryConfig {
    chainID: IChainID;
    minGasPrice: IGasPrice;
    minGasLimit: IGasLimit;
    gasLimitPerByte: IGasLimit;

    gasLimitESDTIssue: IGasLimit;
    gasLimitESDTLocalMint: IGasLimit;
    gasLimitESDTLocalBurn: IGasLimit;
    gasLimitSetSpecialRole: IGasLimit;
    gasLimitPausing: IGasLimit;
    gasLimitFreezing: IGasLimit;
    issueCost: BigNumber.Value;

    esdtContractAddress: IAddress;
}

interface IBaseArgs {
    nonce?: INonce;
    value?: ITransactionValue;
    gasPrice?: IGasPrice;
    gasLimit?: IGasLimit;
}

interface IESDTIssueArgs extends IBaseArgs {
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

interface IESDTSetSpecialRoleArgs extends IBaseArgs {
    manager: IAddress;
    user: IAddress;
    tokenIdentifier: string;
    addRoleLocalMint: boolean;
    addRoleLocalBurn: boolean;
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

export class TokenTransactionsFactory {
    private readonly config: ITokensFactoryConfig;

    constructor(config: ITokensFactoryConfig) {
        this.config = config;
    }

    public issueFungible(args: IESDTIssueArgs): Transaction {
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
            executionGasLimit: this.config.gasLimitESDTIssue,
            dataParts: parts
        });
    }

    public setSpecialRole(args: IESDTSetSpecialRoleArgs): Transaction {
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

    public pause(args: IESDTPausingArgs): Transaction {
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

    public freeze(args: IESDTFreezingArgs): Transaction {
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

    public localMint(args: IESDTLocalMintArgs): Transaction {
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

    public localBurn(args: IESDTLocalBurnArgs): Transaction {
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
