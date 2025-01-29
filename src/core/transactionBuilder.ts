import { Address } from "./address";
import { ARGUMENTS_SEPARATOR } from "./constants";
import { Transaction } from "./transaction";

interface Config {
    chainID: string;
    minGasLimit: bigint;
    gasLimitPerByte: bigint;
}

/**
 * @internal
 */
export class TransactionBuilder {
    private config: Config;
    private sender: Address;
    private receiver: Address;
    private dataParts: string[];
    private providedGasLimit: bigint;
    private addDataMovementGas: boolean;
    private amount?: bigint;

    constructor(options: {
        config: Config;
        sender: Address;
        receiver: Address;
        dataParts: string[];
        gasLimit: bigint;
        addDataMovementGas: boolean;
        amount?: bigint;
    }) {
        this.config = options.config;
        this.sender = options.sender;
        this.receiver = options.receiver;
        this.dataParts = options.dataParts;
        this.providedGasLimit = options.gasLimit;
        this.addDataMovementGas = options.addDataMovementGas;
        this.amount = options.amount;
    }

    private computeGasLimit(payload: Uint8Array): bigint {
        if (!this.addDataMovementGas) {
            return this.providedGasLimit;
        }

        const dataMovementGas = this.config.minGasLimit + this.config.gasLimitPerByte * BigInt(payload.length);
        const gasLimit = dataMovementGas + this.providedGasLimit;
        return gasLimit;
    }

    private buildTransactionPayload(): Uint8Array {
        const data = this.dataParts.join(ARGUMENTS_SEPARATOR);
        return Buffer.from(data);
    }

    build(): Transaction {
        const data = this.buildTransactionPayload();
        const gasLimit = this.computeGasLimit(data);

        return new Transaction({
            sender: this.sender,
            receiver: this.receiver,
            gasLimit: gasLimit,
            value: this.amount || 0n,
            data: data.valueOf(),
            chainID: this.config.chainID,
        });
    }
}
