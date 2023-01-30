import { ARGUMENTS_SEPARATOR, TRANSACTION_OPTIONS_DEFAULT, TRANSACTION_VERSION_DEFAULT } from "../../constants";
import { IAddress, IChainID, IGasLimit, IGasPrice, INonce, ITransactionValue } from "../../interface";
import { TransactionOptions, TransactionVersion } from "../../networkParams";
import { Transaction } from "../../transaction";
import { TransactionPayload } from "../../transactionPayload";
import { guardValueIsSet } from "../../utils";

export interface IBuilderBaseConfiguration {
    chainID: IChainID;
    minGasPrice: IGasPrice;
    minGasLimit: IGasLimit;
    gasLimitPerByte: IGasLimit;
}

export interface IBaseBuilderConstructorOptions {
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
    protected value?: ITransactionValue;
    private gasPrice?: IGasPrice;
    private gasLimit?: IGasLimit;
    protected sender?: IAddress;
    protected receiver?: IAddress;

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
        const payload = this.buildTransactionPayload();

        const chainID = this.chainID;
        const sender = this.getSender();
        const receiver = this.getReceiver();
        const gasLimit = this.getGasLimit(payload);
        const gasPrice = this.gasPrice;
        const nonce = this.nonce || 0;
        const value = this.getValue();
        const version = this.getTransactionVersion();
        const options = this.getTransactionOptions();

        return new Transaction({
            chainID: chainID,
            sender: sender,
            receiver: receiver,
            gasLimit: gasLimit,
            gasPrice: gasPrice,
            nonce: nonce,
            value: value,
            data: payload,
            version: version,
            options: options
        });
    }

    buildTransactionPayload(): TransactionPayload {
        const parts = this.buildTransactionPayloadParts();
        const data = parts.join(ARGUMENTS_SEPARATOR);
        return new TransactionPayload(data);
    }

    protected abstract buildTransactionPayloadParts(): string[];

    protected getSender(): IAddress {
        guardValueIsSet("sender", this.sender);
        return this.sender!;
    }

    protected getReceiver(): IAddress {
        guardValueIsSet("receiver", this.receiver);
        return this.receiver!;
    }

    protected getGasLimit(payload: TransactionPayload): IGasLimit {
        if (this.gasLimit) {
            return this.gasLimit;
        }

        const gasLimit = this.computeDataMovementGas(payload).valueOf() + this.estimateExecutionGas().valueOf();
        return gasLimit;
    }

    protected computeDataMovementGas(payload: TransactionPayload): IGasLimit {
        return this.minGasLimit.valueOf() + this.gasLimitPerByte.valueOf() * payload.length();
    }

    protected abstract estimateExecutionGas(): IGasLimit;

    protected getValue(): ITransactionValue {
        return this.value || 0;
    }

    protected getTransactionVersion(): TransactionVersion {
        return new TransactionVersion(TRANSACTION_VERSION_DEFAULT);
    }

    protected getTransactionOptions(): TransactionOptions {
        return new TransactionOptions(TRANSACTION_OPTIONS_DEFAULT);
    }
}
