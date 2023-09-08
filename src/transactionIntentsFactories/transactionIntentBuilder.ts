import { BigNumber } from "bignumber.js";
import { IAddress, ITransactionPayload } from "../interface";
import { ARGUMENTS_SEPARATOR } from "../constants";
import { TransactionPayload } from "../transactionPayload";
import { TransactionIntent } from "../transactionIntent";

interface Config {
    minGasLimit: BigNumber.Value;
    gasLimitPerByte: BigNumber.Value;
}

export class TransactionIntentBuilder {
    private config: Config;
    private sender: IAddress;
    private receiver: IAddress;
    private dataParts: string[];
    private executionGasLimit: BigNumber.Value;
    private value?: BigNumber.Value;

    constructor(options: {
        config: Config,
        sender: IAddress,
        receiver: IAddress,
        dataParts: string[],
        executionGasLimit: BigNumber.Value,
        value?: BigNumber.Value
    }) {
        this.config = options.config;
        this.sender = options.sender;
        this.receiver = options.receiver;
        this.dataParts = options.dataParts;
        this.executionGasLimit = options.executionGasLimit;
        this.value = options.value;
    }

    private computeGasLimit(payload: ITransactionPayload, executionGasLimit: BigNumber.Value): BigNumber.Value {
        const dataMovementGas = new BigNumber(this.config.minGasLimit).plus(new BigNumber(this.config.gasLimitPerByte).multipliedBy(payload.length()));
        const gasLimit = dataMovementGas.plus(executionGasLimit);
        return gasLimit;
    }

    private buildTransactionPayload(): TransactionPayload {
        const data = this.dataParts.join(ARGUMENTS_SEPARATOR);
        return new TransactionPayload(data);
    }

    build(): TransactionIntent {
        const data = this.buildTransactionPayload()
        const gasLimit = this.computeGasLimit(data, this.executionGasLimit);

        return new TransactionIntent({
            sender: this.sender.bech32(),
            receiver: this.receiver.bech32(),
            gasLimit: gasLimit,
            value: this.value || 0,
            data: data.valueOf()
        })
    }
}
