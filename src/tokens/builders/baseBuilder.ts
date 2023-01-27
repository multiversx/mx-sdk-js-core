import { TRANSACTION_OPTIONS_DEFAULT, TRANSACTION_VERSION_DEFAULT } from "../../constants";
import { IAddress, ITransactionValue } from "../../interface";
import { Transaction } from "../../transaction";
import { TransactionPayload } from "../../transactionPayload";
import { bufferToPaddedHex, stringToBuffer } from "../codec";
import { IBaseBuilderConstructorOptions, IChainID, IGasLimit, IGasPrice, INonce, ITransactionOptions, ITransactionVersion } from "../interface";

export interface IBuilderBaseConfiguration {
    chainID: IChainID;
    minGasPrice: IGasPrice;
    minGasLimit: IGasLimit;
    gasLimitPerByte: IGasLimit;
}

interface IBaseBuilderConstructorOptions {
    nonce?: INonce;
    value?: ITransactionValue;
    gasPrice?: IGasPrice;
    gasLimit?: IGasLimit;
}

export abstract class BuilderBase {
    private chainID: IChainID;
    private minGasLimit: IGasLimit;
    private gasLimitPerByte: IGasLimit;

    private nonce?: INonce;
    private value?: ITransactionValue;
    private gasPrice?: IGasPrice;
    private gasLimit?: IGasLimit;
    private sender?: IAddress;
    private receiver?: IAddress;

    constructor(config: IBuilderBaseConfiguration, options: IBaseBuilderConstructorOptions) {
        this.chainID = config.chainID;
        this.minGasLimit = config.minGasLimit;
        this.gasLimitPerByte = config.gasLimitPerByte;

        this.nonce = options.nonce;
        this.value = options.value;
        this.gasLimit = options.gasLimit;
        this.gasPrice = options.gasPrice || config.minGasPrice;
    }

    buildTransaction(): Transaction {
        const chainID = this.getChainID();
        const sender = this.getSender();
        const payload = this.buildTransactionPayload();


    }

    buildTransactionPayload(): TransactionPayload {
        const data = this.buildTransactionPayloadString();
        return new TransactionPayload(data);
    }

    protected buildTransactionPayloadString(): string {
        const hexArguments = this.buildArguments().map(arg => bufferToPaddedHex(arg));
        const parts = [this.getFunctionName()].concat(hexArguments);
        const data = parts.join("@");
        return data;
    }

    protected buildTransactionPayloadParts(): Buffer[] {
        const func = stringToBuffer(this.getFunctionName());
        const args = this.buildArguments();
        const parts = [func].concat(args);
        return parts;
    }

    getChainID(): IChainID {
        return this.chainID;
    }

    getNonce(): INonce {
        return this.nonce || 0;
    }

    setNonce(value: INonce) {
        this.nonce = value;
    }

    getGasPrice(): IGasPrice {
        return this.gasPrice;
    }

    setGasPrice(value: IGasPrice) {
        this.gasPrice = value;
    }

    getGasLimit(): IGasLimit {
        return this.gasLimit || this.getDefaultGasLimit();
    }

    protected abstract getDefaultGasLimit(): IGasLimit;

    setGasLimit(value: IGasLimit) {
        this.gasLimit = value;
    }

    getTransactionVersion(): ITransactionVersion {
        return TRANSACTION_VERSION_DEFAULT;
    }

    getTransactionOptions(): ITransactionOptions {
        return TRANSACTION_OPTIONS_DEFAULT;
    }
}
