import { assert } from "chai";
import { Address } from "../core/address";
import { TransactionsFactoryConfig } from "../core/transactionsFactoryConfig";
import { GovernanceTransactionsFactory } from "./governanceTransactionsFactory";
import { Vote } from "./resources";

describe("test governance transactions factory", function () {
    const config = new TransactionsFactoryConfig({
        chainID: "D",
    });
    const factory = new GovernanceTransactionsFactory({ config });

    const commitHash = "1db734c0315f9ec422b88f679ccfe3e0197b9d67";
    const alice = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
    const governanceAddress = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqrlllsrujgla";

    it("should create transaction for creating new proposal", function () {
        const expectedData = `proposal@${Buffer.from(commitHash).toString("hex")}@0a@0f`;

        const transaction = factory.createTransactionForNewProposal(alice, {
            commitHash: commitHash,
            startVoteEpoch: 10,
            endVoteEpoch: 15,
            nativeTokenAmount: 1000_000000000000000000n,
        });

        assert.equal(transaction.sender.toBech32(), alice.toBech32());
        assert.equal(transaction.receiver.toBech32(), governanceAddress);
        assert.equal(transaction.value, 1000_000000000000000000n);
        assert.equal(transaction.chainID, config.chainID);
        assert.equal(transaction.gasLimit, 50_192_500n);
        assert.equal(transaction.data.toString(), expectedData);
    });

    it("should create transaction for voting", function () {
        const transaction = factory.createTransactionForVoting(alice, {
            proposalNonce: 1,
            vote: Vote.YES,
        });

        assert.equal(transaction.sender.toBech32(), alice.toBech32());
        assert.equal(transaction.receiver.toBech32(), governanceAddress);
        assert.equal(transaction.value, 0n);
        assert.equal(transaction.chainID, config.chainID);
        assert.equal(transaction.gasLimit, 5_171_000n);
        assert.equal(transaction.data.toString(), "vote@01@796573");
    });

    it("should create transaction for closing proposal", function () {
        const transaction = factory.createTransactionForClosingProposal(alice, {
            proposalNonce: 1,
        });

        assert.equal(transaction.sender.toBech32(), alice.toBech32());
        assert.equal(transaction.receiver.toBech32(), governanceAddress);
        assert.equal(transaction.value, 0n);
        assert.equal(transaction.chainID, config.chainID);
        assert.equal(transaction.gasLimit, 50_074_000n);
        assert.equal(transaction.data.toString(), "closeProposal@01");
    });

    it("should create transaction for clearing ended proposals", function () {
        const expectedData =
            "clearEndedProposals@0139472eff6886771a982f3083da5d421f24c29181e63888228dc81ca60d69e1@8049d639e5a6980d1cd2392abcce41029cda74a1563523a202f09641cc2618f8";

        const transaction = factory.createTransactionForClearingEndedProposals(alice, {
            proposers: [alice, Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx")],
        });

        assert.equal(transaction.sender.toBech32(), alice.toBech32());
        assert.equal(transaction.receiver.toBech32(), governanceAddress);
        assert.equal(transaction.value, 0n);
        assert.equal(transaction.chainID, config.chainID);
        assert.equal(transaction.gasLimit, 150_273_500n);
        assert.equal(transaction.data.toString(), expectedData);
    });

    it("should create transaction for claiming accumulated fees", function () {
        const transaction = factory.createTransactionForClaimingAccumulatedFees(alice);

        assert.equal(transaction.sender.toBech32(), alice.toBech32());
        assert.equal(transaction.receiver.toBech32(), governanceAddress);
        assert.equal(transaction.value, 0n);
        assert.equal(transaction.chainID, config.chainID);
        assert.equal(transaction.gasLimit, 1_080_000n);
        assert.equal(transaction.data.toString(), "claimAccumulatedFees");
    });

    it("should create transaction for changing config", function () {
        const expectedData =
            "changeConfig@31303030303030303030303030303030303030303030@3130303030303030303030303030303030303030@35303030@33303030@36303030";

        const transaction = factory.createTransactionForChangingConfig(alice, {
            proposalFee: 1000000000000000000000n,
            lastProposalFee: 10000000000000000000n,
            minQuorum: 5000,
            minVetoThreshold: 3000,
            minPassThreshold: 6000,
        });

        assert.equal(transaction.sender.toBech32(), alice.toBech32());
        assert.equal(transaction.receiver.toBech32(), governanceAddress);
        assert.equal(transaction.value, 0n);
        assert.equal(transaction.chainID, config.chainID);
        assert.equal(transaction.gasLimit, 50_237_500n);
        assert.equal(transaction.data.toString(), expectedData);
    });
});
