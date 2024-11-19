import { assert } from "chai";
import { Address } from "../address";
import { ContractResultItem, ContractResults } from "../networkProviders";
import { TransactionEvent, TransactionEventTopic } from "../transactionEvents";
import { TransactionLogs } from "../transactionLogs";
import { TransactionOnNetwork } from "../transactions";
import { DelegationTransactionsOutcomeParser } from "./delegationTransactionsOutcomeParser";

describe("test delegation transactions outcome parser", () => {
    const parser = new DelegationTransactionsOutcomeParser();

    it("should test parseCreateNewDelegationContract ", () => {
        const contractAddress = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqy8lllls62y8s5");
        let encodedTopics = [
            new TransactionEventTopic("Q8M8GTdWSAAA"),
            new TransactionEventTopic("Q8M8GTdWSAAA"),
            new TransactionEventTopic("AQ=="),
            new TransactionEventTopic("Q8M8GTdWSAAA"),
            new TransactionEventTopic("AAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAABD///8="),
        ];

        const delegateEvent = new TransactionEvent({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            identifier: "delegate",
            topics: encodedTopics,
        });

        encodedTopics = [
            new TransactionEventTopic("AAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAABD///8="),
            new TransactionEventTopic("PDXX6ssamaSgzKpTfvDMCuEJ9B9sK0AiA+Yzv7sHH1w="),
        ];
        const scDeployEvent = new TransactionEvent({
            address: new Address("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqy8lllls62y8s5"),
            identifier: "SCDeploy",
            topics: encodedTopics,
        });

        const logs = new TransactionLogs({ events: [delegateEvent, scDeployEvent] });

        encodedTopics = [new TransactionEventTopic("b2g6sUl6beG17FCUIkFwCOTGJjoJJi5SjkP2077e6xA=")];
        const scResultEvent = new TransactionEvent({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            identifier: "completedTxEvent",
            topics: encodedTopics,
        });

        const scResultLog = new TransactionLogs({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            events: [scResultEvent],
        });

        const scResult = new ContractResults([
            new ContractResultItem({
                sender: new Address("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqylllslmq6y6"),
                receiver: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
                data: "QDZmNmJAMDAwMDAwMDAwMDAwMDAwMDAwMDEwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAxMGZmZmZmZg==",
                logs: scResultLog,
            }),
        ]);

        const txOutcome = new TransactionOnNetwork({ contractResults: scResult, logs: logs });

        const outcome = parser.parseCreateNewDelegationContract(txOutcome);

        assert.lengthOf(outcome, 1);
        assert.equal(outcome[0].contractAddress, contractAddress.toBech32());
    });
});
