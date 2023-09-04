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

    constructor(config: Config, sender: IAddress, receiver: IAddress, dataParts: string[], executionGasLimit: BigNumber.Value, value?: BigNumber.Value) {
        this.config = config;
        this.sender = sender;
        this.receiver = receiver;
        this.dataParts = dataParts;
        this.executionGasLimit = executionGasLimit;
        this.value = value;
    }

    private computeGasLimit(payload: ITransactionPayload, executionGasLimit: BigNumber.Value): BigNumber.Value {
        const dataMovementGas = new BigNumber(this.config.minGasLimit).plus(new BigNumber(this.config.gasLimitPerByte).multipliedBy(new BigNumber(payload.length())));
        const gasLimit = new BigNumber(dataMovementGas).plus(new BigNumber(executionGasLimit));
        return gasLimit;
    }

    private buildTransactionPayload(): TransactionPayload {
        const data = this.dataParts.join(ARGUMENTS_SEPARATOR);
        return new TransactionPayload(data);
    }

    build(): TransactionIntent {
        const data = this.buildTransactionPayload()
        const gasLimit = this.computeGasLimit(data, this.executionGasLimit);

        return new TransactionIntent(
            this.sender.bech32(),
            this.receiver.bech32(),
            gasLimit,
            this.value !== undefined ? this.value : 0,
            data.valueOf()
        )
    }
}
