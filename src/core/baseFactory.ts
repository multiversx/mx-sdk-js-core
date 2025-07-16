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
        if (gasLimit) {
            transaction.gasLimit = gasLimit;
        } else if (this.gasLimitEstimator) {
            transaction.gasLimit = await this.gasLimitEstimator.estimateGasLimit(transaction);
        } else if (configGasLimit !== undefined) {
            const dataMovementGas =
                this.gasConfig.minGasLimit + this.gasConfig.gasLimitPerByte * BigInt(transaction.data.length);
            transaction.gasLimit = dataMovementGas + configGasLimit;
        } else {
            throw new Error("Gas limit must be provided or a gas limit estimator must be set.");
        }
    }
}
