import { assert } from "chai";
import { Address, TransactionEvent, TransactionLogs, TransactionOnNetwork } from "../core";
import { b64TopicsToBytes } from "../testutils";
import { SmartContractResult } from "../transactionsOutcomeParsers";
import { DelegationTransactionsOutcomeParser } from "./delegationTransactionsOutcomeParser";

describe("test delegation transactions outcome parser", () => {
    const parser = new DelegationTransactionsOutcomeParser();

    it("should test parseCreateNewDelegationContract ", () => {
        const contractAddress = Address.newFromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqy8lllls62y8s5");
        let encodedTopics = [
            "Q8M8GTdWSAAA",
            "Q8M8GTdWSAAA",
            "AQ==",
            "Q8M8GTdWSAAA",
            "AAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAABD///8=",
        ];

        const delegateEvent = new TransactionEvent({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            identifier: "delegate",
            topics: b64TopicsToBytes(encodedTopics),
        });

        encodedTopics = [
            "AAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAABD///8=",
            "PDXX6ssamaSgzKpTfvDMCuEJ9B9sK0AiA+Yzv7sHH1w=",
        ];
        const scDeployEvent = new TransactionEvent({
            address: new Address("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqy8lllls62y8s5"),
            identifier: "SCDeploy",
            topics: b64TopicsToBytes(encodedTopics),
        });

        const logs = new TransactionLogs({ events: [delegateEvent, scDeployEvent] });

        encodedTopics = ["b2g6sUl6beG17FCUIkFwCOTGJjoJJi5SjkP2077e6xA="];
        const scResultEvent = new TransactionEvent({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            identifier: "completedTxEvent",
            topics: b64TopicsToBytes(encodedTopics),
        });

        const scResultLog = new TransactionLogs({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            events: [scResultEvent],
        });

        const scResult = new SmartContractResult({
            sender: new Address("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqylllslmq6y6"),
            receiver: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            data: Buffer.from(
                "QDZmNmJAMDAwMDAwMDAwMDAwMDAwMDAwMDEwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAxMGZmZmZmZg==",
                "base64",
            ),
            logs: scResultLog,
        });
        const transaction = new TransactionOnNetwork({ smartContractResults: [scResult], logs: logs });

        const outcome = parser.parseCreateNewDelegationContract(transaction);

        assert.lengthOf(outcome, 1);
        assert.equal(outcome[0].contractAddress, contractAddress.toBech32());
    });

    it("should test parseClaimRewards ", () => {
        const encodedTopics = ["AvYUMPsrWw==", "ZmFsc2U=", "AAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAABD///8="];

        const claimRewardsEvent = new TransactionEvent({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            identifier: "claimRewards",
            topics: b64TopicsToBytes(encodedTopics),
        });

        const logs = new TransactionLogs({ events: [claimRewardsEvent] });

        const transaction = new TransactionOnNetwork({ logs: logs });

        const outcome = parser.parseClaimRewards(transaction);

        assert.lengthOf(outcome, 1);
        assert.equal(outcome[0].amount, 833516534967131n);
    });

    it("should test parseDelegate ", () => {
        const encodedTopics = [
            "DeC2s6dkAAA=",
            "DeC2s6dkAAA=",
            "pg==",
            "Gasl6c5mNE7QJw==",
            "AAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAABn///8=",
        ];

        const delegateEvent = new TransactionEvent({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            identifier: "delegate",
            topics: b64TopicsToBytes(encodedTopics),
        });

        const logs = new TransactionLogs({ events: [delegateEvent] });
        const transaction = new TransactionOnNetwork({ logs: logs });

        const outcome = parser.parseDelegate(transaction);

        assert.lengthOf(outcome, 1);
        assert.equal(outcome[0].amount, 1000000000000000000n);
    });

    it("should test parseUndelegate ", () => {
        const encodedTopics = ["DeC2s6dkAAA=", "DeC2s6dkAAA=", "", "irzOS6k1Z2fS", "ZnVuZA4="];

        const undelegateEvent = new TransactionEvent({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            identifier: "unDelegate",
            topics: b64TopicsToBytes(encodedTopics),
        });

        const logs = new TransactionLogs({ events: [undelegateEvent] });
        const transaction = new TransactionOnNetwork({ logs: logs });

        const outcome = parser.parseUndelegate(transaction);

        assert.lengthOf(outcome, 1);
        assert.equal(outcome[0].amount, 1000000000000000000n);
    });

    it("should test parseRedelegateRewards ", () => {
        const encodedTopics = [
            "BM+vfE0H7g==",
            "EVkZ9Arz3e4=",
            "Aw==",
            "iluVsi0Qb93u",
            "AAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAC3///8=",
        ];

        const redelegateRewardsEvent = new TransactionEvent({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            identifier: "delegate",
            topics: b64TopicsToBytes(encodedTopics),
        });

        const logs = new TransactionLogs({ events: [redelegateRewardsEvent] });
        const transaction = new TransactionOnNetwork({ logs: logs });

        const outcome = parser.parseRedelegateRewards(transaction);

        assert.lengthOf(outcome, 1);
        assert.equal(outcome[0].amount, 1354252518492142n);
    });
});
