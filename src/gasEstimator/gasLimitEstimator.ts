import { Transaction } from "../core";

interface ITransactionCostResponse {
    gasLimit: number;
}

interface INetworkProvider {
    estimateTransactionCost(tx: Transaction): Promise<ITransactionCostResponse>;
}

export class GasLimitEstimator {
    private networkProvider: INetworkProvider;
    private gasMultiplier: number;

    constructor(networkProvider: INetworkProvider, gasMultiplier?: number) {
        this.networkProvider = networkProvider;
        this.gasMultiplier = gasMultiplier || 1;
    }

    async estimateGasLimit(transaction: Transaction): Promise<bigint> {
        const gasLimit = (await this.networkProvider.estimateTransactionCost(transaction)).gasLimit;
        return BigInt(gasLimit * this.gasMultiplier);
    }
}
