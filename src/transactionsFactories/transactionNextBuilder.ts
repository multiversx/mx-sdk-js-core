import { BigNumber } from "bignumber.js";
import { IAddress, ITransactionPayload } from "../interface";
import { ARGUMENTS_SEPARATOR } from "../constants";
import { TransactionPayload } from "../transactionPayload";
import { TransactionNext } from "../transaction";

interface Config {
    minGasLimit: BigNumber.Value;
    gasLimitPerByte: BigNumber.Value;
}

export class TransactionNextBuilder {
    private config: Config;
    private sender: IAddress;
    private receiver: IAddress;
    private dataParts: string[];
    private providedGasLimit: BigNumber;
    private addDataMovementGas: boolean;
    private amount?: BigNumber.Value;
    private chainID: string;

    constructor(options: {
        config: Config,
        sender: IAddress,
        receiver: IAddress,
        dataParts: string[],
        gasLimit: BigNumber.Value,
        addDataMovementGas: boolean,
        amount?: BigNumber.Value,
        chainID: string;
    }) {
        this.config = options.config;
        this.sender = options.sender;
        this.receiver = options.receiver;
        this.dataParts = options.dataParts;
        this.providedGasLimit = new BigNumber(options.gasLimit);
        this.addDataMovementGas = options.addDataMovementGas;
        this.amount = options.amount;
        this.chainID = options.chainID;
    }

    private computeGasLimit(payload: ITransactionPayload): BigNumber.Value {
        if (!this.addDataMovementGas) {
            return this.providedGasLimit;
        }

        const dataMovementGas = new BigNumber(this.config.minGasLimit).plus(new BigNumber(this.config.gasLimitPerByte).multipliedBy(payload.length()));
        const gasLimit = dataMovementGas.plus(this.providedGasLimit);
        return gasLimit;
    }

    private buildTransactionPayload(): TransactionPayload {
        const data = this.dataParts.join(ARGUMENTS_SEPARATOR);
        return new TransactionPayload(data);
    }

    build(): TransactionNext {
        const data = this.buildTransactionPayload()
        const gasLimit = this.computeGasLimit(data);

        return new TransactionNext({
            sender: this.sender.bech32(),
            receiver: this.receiver.bech32(),
            gasLimit: gasLimit,
            value: this.amount || 0,
            data: data.valueOf(),
            chainID: this.chainID
        })
    }
}
