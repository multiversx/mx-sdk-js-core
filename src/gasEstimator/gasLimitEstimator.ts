import { ErrGasLimitCannotBeEstimated, Transaction } from "../core";

interface ITransactionCostResponse {
    gasLimit: number;
}

interface INetworkProvider {
    estimateTransactionCost(tx: Transaction): Promise<ITransactionCostResponse>;
}

export class GasLimitEstimator {
    private networkProvider: INetworkProvider;
    private gasMultiplier: number;

    constructor(options: { networkProvider: INetworkProvider; gasMultiplier?: number }) {
        this.networkProvider = options.networkProvider;
        this.gasMultiplier = options.gasMultiplier || 1.0;
    }

    async estimateGasLimit(options: { transaction: Transaction }): Promise<bigint> {
        try {
            const gasLimit = (await this.networkProvider.estimateTransactionCost(options.transaction)).gasLimit;
            const multipliedEstimatedGas = Math.floor(gasLimit * this.gasMultiplier);
            return BigInt(multipliedEstimatedGas);
        } catch (error: any) {
            throw new ErrGasLimitCannotBeEstimated(error);
        }
    }
}
