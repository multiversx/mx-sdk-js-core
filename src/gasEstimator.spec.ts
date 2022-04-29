import { assert } from "chai";
import { GasEstimator } from "./gasEstimator";

describe("test gas estimator", () => {
    it("should estimate gas limit (default gas configuration)", () => {
        const estimator = new GasEstimator();

        assert.equal(estimator.forEGLDTransfer(0), 50000);
        assert.equal(estimator.forEGLDTransfer(3), 50000 + 3 * 1500);

        assert.equal(estimator.forESDTTransfer(80), 50000 + 80 * 1500 + 200000 + 100000);
        assert.equal(estimator.forESDTTransfer(100), 50000 + 100 * 1500 + 200000 + 100000);

        assert.equal(estimator.forESDTNFTTransfer(80), 50000 + 80 * 1500 + 200000 + 800000);
        assert.equal(estimator.forESDTNFTTransfer(100), 50000 + 100 * 1500 + 200000 + 800000);

        assert.equal(estimator.forMultiESDTNFTTransfer(80, 1), 50000 + 80 * 1500 + (200000 + 800000) * 1);
        assert.equal(estimator.forMultiESDTNFTTransfer(80, 3), 50000 + 80 * 1500 + (200000 + 800000) * 3);
    });

    it("should estimate gas limit (custom gas configuration)", () => {
        const estimator = new GasEstimator({
            minGasLimit: 10000,
            gasPerDataByte: 3000,
            gasCostESDTTransfer: 200000,
            gasCostESDTNFTTransfer: 300000,
            gasCostESDTNFTMultiTransfer: 400000
        });

        assert.equal(estimator.forEGLDTransfer(0), 10000);
        assert.equal(estimator.forEGLDTransfer(3), 10000 + 3 * 3000);

        assert.equal(estimator.forESDTTransfer(80), 10000 + 80 * 3000 + 200000 + 100000);
        assert.equal(estimator.forESDTTransfer(100), 10000 + 100 * 3000 + 200000 + 100000);

        assert.equal(estimator.forESDTNFTTransfer(80), 10000 + 80 * 3000 + 300000 + 800000);
        assert.equal(estimator.forESDTNFTTransfer(100), 10000 + 100 * 3000 + 300000 + 800000);

        assert.equal(estimator.forMultiESDTNFTTransfer(80, 1), 10000 + 80 * 3000 + (400000 + 800000) * 1);
        assert.equal(estimator.forMultiESDTNFTTransfer(80, 3), 10000 + 80 * 3000 + (400000 + 800000) * 3);
    });
});
