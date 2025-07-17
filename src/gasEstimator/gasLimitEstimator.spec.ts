import { assert } from "chai";
import { Address, TransactionStatus } from "../core";
import { Transaction } from "../core/transaction";
import { MockNetworkProvider } from "../testutils";
import { GasLimitEstimator } from "./gasLimitEstimator";

describe("GasLimitEstimator tests", () => {
    it("should estimate gas limit with default multiplier", async () => {
        const networkProvider = new MockNetworkProvider();
        const mockTxCostResponse = {
            raw: {},
            gasLimit: 50000,
            status: TransactionStatus.createUnknown(),
        };
        networkProvider.mockTransactionCostResponse = mockTxCostResponse;

        const estimator = new GasLimitEstimator({ networkProvider });
        const tx = new Transaction({
            sender: Address.empty(),
            receiver: Address.empty(),
            chainID: "D",
            gasLimit: 0n,
            value: 10000000n,
        });

        const estimatedGas = await estimator.estimateGasLimit({ transaction: tx });
        assert.equal(estimatedGas, 50000n);
    });

    it("should estimate gas limit with multiplier", async () => {
        const networkProvider = new MockNetworkProvider();
        const mockTxCostResponse = {
            raw: {},
            gasLimit: 50000,
            status: TransactionStatus.createUnknown(),
        };
        networkProvider.mockTransactionCostResponse = mockTxCostResponse;

        const estimator = new GasLimitEstimator({ networkProvider: networkProvider, gasMultiplier: 1.5 });
        const tx = new Transaction({
            sender: Address.empty(),
            receiver: Address.empty(),
            chainID: "D",
            gasLimit: 0n,
            value: 10000000n,
        });

        const estimatedGas = await estimator.estimateGasLimit({ transaction: tx });
        assert.equal(estimatedGas, 75000n);
    });

    it("should round down estimated gas limit with multiplier", async () => {
        const networkProvider = new MockNetworkProvider();
        const mockTxCostResponse = {
            raw: {},
            gasLimit: 50000,
            status: TransactionStatus.createUnknown(),
        };
        networkProvider.mockTransactionCostResponse = mockTxCostResponse;

        const estimator = new GasLimitEstimator({ networkProvider: networkProvider, gasMultiplier: 1.98765 });
        const tx = new Transaction({
            sender: Address.empty(),
            receiver: Address.empty(),
            chainID: "D",
            gasLimit: 0n,
            value: 10000000n,
        });

        const estimatedGas = await estimator.estimateGasLimit({ transaction: tx });
        assert.equal(estimatedGas, 99382n);
    });
});
