import { assert } from "chai";
import { TransactionEvent, TransactionLogs, TransactionOnNetwork } from "../core";
import { Address } from "../core/address";
import { b64TopicsToBytes } from "../testutils";
import { GovernanceTransactionsOutcomeParser } from "./governanceTransactionsOutcomeParser";

describe("test multisig transactions outcome parser", function () {
    const parser = new GovernanceTransactionsOutcomeParser({});

    it("should parse transaction for creating new proposal", function () {
        const commitHash = "1db734c0315f9ec422b88f679ccfe3e0197b9d67";

        const proposalEvent = new TransactionEvent({
            address: Address.empty(),
            identifier: "proposal",
            topics: [new Uint8Array([0x01]), Buffer.from(commitHash), Buffer.from("5"), Buffer.from("7")],
        });
        const logs = new TransactionLogs({ events: [proposalEvent] });

        const transaction = new TransactionOnNetwork({ logs: logs });

        const outcome = parser.parseNewProposal(transaction);
        assert.equal(outcome.length, 1);
        assert.equal(outcome[0].proposalNonce, 1);
        assert.equal(outcome[0].commitHash, commitHash);
        assert.equal(outcome[0].startVoteEpoch, 53);
        assert.equal(outcome[0].endVoteEpoch, 55);
    });

    it("should parse transaction for voting", function () {
        const encodedTopics = ["AQ==", "eWVz", "BlpNol0wFsAAAA==", "BlpNol0wFsAAAA=="];

        const voteEvent = new TransactionEvent({
            address: Address.empty(),
            identifier: "vote",
            topics: b64TopicsToBytes(encodedTopics),
        });
        const logs = new TransactionLogs({ events: [voteEvent] });

        const transaction = new TransactionOnNetwork({ logs: logs });

        const outcome = parser.parseVote(transaction);
        assert.equal(outcome.length, 1);
        assert.equal(outcome[0].proposalNonce, 1);
        assert.equal(outcome[0].vote, "yes");
        assert.equal(outcome[0].totalStake, 30000_000000000000000000n);
        assert.equal(outcome[0].votingPower, 30000_000000000000000000n);
    });

    it("should parse transaction for delegating vote", function () {
        const encodedTopics = [
            "AQ==",
            "YWJzdGFpbg==",
            "a3Qc0P1f8raaWzOVkcJbHHxHOx2+LI6S8CM9aV+W6KY=",
            "Ah4Z4Mm6skAAAA==",
            "Ah4Z4Mm6skAAAA==",
        ];

        const voteEvent = new TransactionEvent({
            address: Address.empty(),
            identifier: "delegateVote",
            topics: b64TopicsToBytes(encodedTopics),
        });
        const logs = new TransactionLogs({ events: [voteEvent] });

        const transaction = new TransactionOnNetwork({ logs: logs });

        const outcome = parser.parseDelegateVote(transaction);
        assert.equal(outcome.length, 1);
        assert.equal(outcome[0].proposalNonce, 1);
        assert.equal(outcome[0].vote, "abstain");
        assert.equal(outcome[0].voter.toBech32(), "erd1dd6pe58atletdxjmxw2ersjmr37ywwcahckgayhsyv7kjhukaznqx2mzqf");
        assert.equal(outcome[0].userStake, 10000_000000000000000000n);
        assert.equal(outcome[0].votingPower, 10000_000000000000000000n);
    });

    it("should parse transaction for closing proposal", function () {
        const encodedTopics = ["ZDVkMjRhYTY1ZWY5OWM3NDcxMjkxMmZkOGJiMmE1MDVjY2RmMDYyYw==", "dHJ1ZQ=="];

        const voteEvent = new TransactionEvent({
            address: Address.empty(),
            identifier: "closeProposal",
            topics: b64TopicsToBytes(encodedTopics),
        });
        const logs = new TransactionLogs({ events: [voteEvent] });

        const transaction = new TransactionOnNetwork({ logs: logs });

        const outcome = parser.parseCloseProposal(transaction);
        assert.equal(outcome.length, 1);
        assert.equal(outcome[0].commitHash, "d5d24aa65ef99c74712912fd8bb2a505ccdf062c");
        assert.equal(outcome[0].passed, true);
    });
});
