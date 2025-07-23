import { ARGUMENTS_SEPARATOR } from "./constants";
import { IGasLimitEstimator } from "./interfaces";
import { Transaction } from "./transaction";

interface Config {
    minGasLimit: bigint;
    gasLimitPerByte: bigint;
}

/**
 * @internal
 */
export class BaseFactory {
    private gasConfig: Config;
    private gasLimitEstimator?: IGasLimitEstimator;

    constructor(options: { config: Config; gasLimitEstimator?: IGasLimitEstimator }) {
        this.gasConfig = options.config;
        this.gasLimitEstimator = options.gasLimitEstimator;
    }

    protected setTransactionPayload(transaction: Transaction, dataParts: string[]): void {
        const data = dataParts.join(ARGUMENTS_SEPARATOR);
        transaction.data = Buffer.from(data);
    }

    /**
     * Sets the gas limit for the transaction.
     * @param gasLimit - Optional gas limit to set. This is the value provided by the user.
     * @param configGasLimit - Optional gas limit from the configuration. This is computed internally based on some config values.
     */
    protected async setGasLimit(transaction: Transaction, gasLimit?: bigint, configGasLimit?: bigint): Promise<void> {
        if (gasLimit !== undefined) {
            transaction.gasLimit = gasLimit;
            return;
        }

        if (this.gasLimitEstimator) {
            transaction.gasLimit = await this.gasLimitEstimator.estimateGasLimit({ transaction });
            return;
        }

        if (configGasLimit !== undefined) {
            const dataMovementGas =
                this.gasConfig.minGasLimit + this.gasConfig.gasLimitPerByte * BigInt(transaction.data.length);
            transaction.gasLimit = dataMovementGas + configGasLimit;
            return;
        }

        throw new Error("Either provide a `gasLimit` parameter or initialize the factory with a `gasLimitEstimator`.");
    }
}
