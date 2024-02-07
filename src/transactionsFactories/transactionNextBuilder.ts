import { BigNumber } from "bignumber.js";
import { IAddress, ITransactionPayload } from "../interface";
import { ARGUMENTS_SEPARATOR, TRANSACTION_MIN_GAS_PRICE, TRANSACTION_OPTIONS_DEFAULT, TRANSACTION_VERSION_DEFAULT } from "../constants";
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
    private nonce?: BigNumber.Value;
    private value?: BigNumber.Value;
    private senderUsername?: string;
    private receiverUsername?: string;
    private gasPrice?: BigNumber.Value;
    private chainID: string;
    private version?: number;
    private options?: number;
    private guardian?: string;

    constructor(options: {
        config: Config,
        nonce?: BigNumber.Value;
        value?: BigNumber.Value;
        sender: IAddress,
        receiver: IAddress,
        senderUsername?: string;
        receiverUsername?: string;
        gasPrice?: BigNumber.Value;
        gasLimit: BigNumber.Value,
        dataParts: string[],
        chainID: string;
        version?: number;
        options?: number;
        guardian?: string;
        addDataMovementGas: boolean,
        amount?: BigNumber.Value
    }) {
        this.config = options.config;
        this.nonce = options.nonce;
        this.value = options.value || new BigNumber(0);;
        this.sender = options.sender;
        this.receiver = options.receiver;
        this.senderUsername = options.senderUsername || "";
        this.receiverUsername = options.receiverUsername || "";
        this.gasPrice = options.gasPrice || new BigNumber(TRANSACTION_MIN_GAS_PRICE);
        this.dataParts = options.dataParts;
        this.chainID = options.chainID;
        this.version = options.version || TRANSACTION_VERSION_DEFAULT;
        this.options = options.options || TRANSACTION_OPTIONS_DEFAULT;
        this.guardian = options.guardian || "";
        this.providedGasLimit = new BigNumber(options.gasLimit);
        this.addDataMovementGas = options.addDataMovementGas;
        this.amount = options.amount;
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
            nonce: this.nonce || 0,
            value: this.amount || 0,
            sender: this.sender.bech32(),
            receiver: this.receiver.bech32(),
            senderUsername: this.senderUsername || "",
            receiverUsername: this.receiverUsername || "",
            gasPrice: this.gasPrice || new BigNumber(TRANSACTION_MIN_GAS_PRICE),
            gasLimit: gasLimit,
            data: data.valueOf(),
            chainID: this.chainID,
            version: this.version || TRANSACTION_VERSION_DEFAULT,
            options: this.options || TRANSACTION_OPTIONS_DEFAULT,
            guardian: this.guardian || ""
        })
    }
}
