import { assert } from "chai";
import { DelegationTransactionsOutcomeParser } from "./delegationTransactionsOutcomeParser";
import { SmartContractResult, TransactionEvent, TransactionLogs, TransactionOutcome } from "./resources";
import { Address } from "../address";

describe("test token management transactions outcome parser", () => {
    const parser = new DelegationTransactionsOutcomeParser();

    it("should test parseCreateNewDelegationContract ", () => {
        const contractAddress = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqpf0llllsccsy0c");
        const contractAddressB64 = Buffer.from(contractAddress.toBech32()).toString("base64");

        const delegateEvent = new TransactionEvent({
            address: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            identifier: "delegate",
            topics: [
                "Q8M8GTdWSAAA",
                "Q8M8GTdWSAAA",
                "AQ==",
                "Q8M8GTdWSAAA",
                "AAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAABD///8=",
            ],
        });

        const scDeployEvent = new TransactionEvent({
            address: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqy8lllls62y8s5",
            identifier: "SCDeploy",
            topics: [contractAddressB64, "PDXX6ssamaSgzKpTfvDMCuEJ9B9sK0AiA+Yzv7sHH1w="],
        });

        const logs = new TransactionLogs({ events: [delegateEvent, scDeployEvent] });

        const scResultEvent = new TransactionEvent({
            address: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            identifier: "completedTxEvent",
            topics: ["b2g6sUl6beG17FCUIkFwCOTGJjoJJi5SjkP2077e6xA="],
        });

        const scResultLog = new TransactionLogs({
            address: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            events: [scResultEvent],
        });

        const scResult = new SmartContractResult({
            sender: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqylllslmq6y6",
            receiver: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            data: Buffer.from(
                "QDZmNmJAMDAwMDAwMDAwMDAwMDAwMDAwMDEwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAxMGZmZmZmZg==",
                "base64",
            ),
            logs: scResultLog,
        });

        const txOutcome = new TransactionOutcome({ smartContractResults: [scResult], transactionLogs: logs });

        const outcome = parser.parseCreateNewDelegationContract(txOutcome);

        assert.lengthOf(outcome, 1);
        assert.equal(outcome[0].contractAddress, contractAddress.toBech32());
    });
});
