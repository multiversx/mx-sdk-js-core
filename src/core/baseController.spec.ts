import { assert } from "chai";
import { Address } from "./address";
import { BaseController } from "./baseController";
import { Transaction } from "./transaction";

class TestableBaseController extends BaseController {
    public exposeSetTransactionGasOptions(
        transaction: Transaction,
        options: { gasLimit?: bigint; gasPrice?: bigint },
    ): void {
        this.setTransactionGasOptions(transaction, options);
    }

    public exposeSetVersionAndOptionsForGuardian(transaction: Transaction): void {
        this.setVersionAndOptionsForGuardian(transaction);
    }
}

describe("BaseController Tests", function () {
    it("set correct gasLimit", function () {
        const controller = new TestableBaseController();

        const transaction = new Transaction({
            sender: Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx"),
            receiver: Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx"),
            gasLimit: 0n,
            chainID: "D",
        });

        controller.exposeSetTransactionGasOptions(transaction, { gasLimit: 50000n });
        assert.equal(transaction.gasLimit, 50000n);

        transaction.guardian = Address.newFromBech32("erd1k2s324ww2g0yj38qn2ch2jwctdy8mnfxep94q9arncc6xecg3xaq6mjse8");
        transaction.relayer = Address.newFromBech32("erd1kyaqzaprcdnv4luvanah0gfxzzsnpaygsy6pytrexll2urtd05ts9vegu7");
        controller.exposeSetTransactionGasOptions(transaction, {});
        assert.equal(transaction.gasLimit, 150000n);
    });

    it("set correct version and options for guarded transactions", function () {
        const controller = new TestableBaseController();

        const transaction = new Transaction({
            sender: Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx"),
            receiver: Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx"),
            gasLimit: 0n,
            chainID: "D",
            version: 0,
            options: 0,
            guardian: Address.newFromBech32("erd1k2s324ww2g0yj38qn2ch2jwctdy8mnfxep94q9arncc6xecg3xaq6mjse8"),
        });

        controller.exposeSetVersionAndOptionsForGuardian(transaction);
        assert.equal(transaction.version, 2);
        assert.equal(transaction.options, 2);
    });
});
