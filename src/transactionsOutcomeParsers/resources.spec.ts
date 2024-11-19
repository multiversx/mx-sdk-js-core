import { assert } from "chai";
import { ContractResultItem, ContractResults } from "../networkProviders/contractResults";
import { TransactionEvent, TransactionEventTopic } from "../transactionEvents";
import { TransactionLogs } from "../transactionLogs";
import { TransactionOnNetwork } from "../transactions";
import { findEventsByFirstTopic, findEventsByIdentifier } from "./resources";

describe("test resources", () => {
    it("finds events by identifier, by first topic", async function () {
        const outcome = new TransactionOnNetwork({
            logs: new TransactionLogs({
                events: [
                    new TransactionEvent({
                        identifier: "foo",
                        topics: [new TransactionEventTopic("a")],
                    }),
                ],
            }),
            contractResults: new ContractResults([
                new ContractResultItem({
                    logs: new TransactionLogs({
                        events: [
                            new TransactionEvent({
                                identifier: "foo",
                                topics: [new TransactionEventTopic("b")],
                            }),
                            new TransactionEvent({
                                identifier: "bar",
                                topics: [new TransactionEventTopic("c")],
                            }),
                        ],
                    }),
                }),
            ]),
        });

        const foundByIdentifierFoo = findEventsByIdentifier(outcome, "foo");
        const foundByIdentifierBar = findEventsByIdentifier(outcome, "bar");
        const foundByTopic = findEventsByFirstTopic(outcome, "b");

        assert.deepEqual(foundByIdentifierFoo, [
            new TransactionEvent({
                identifier: "foo",
                topics: [new TransactionEventTopic("a")],
            }),
            new TransactionEvent({
                identifier: "foo",
                topics: [new TransactionEventTopic("b")],
            }),
        ]);

        assert.deepEqual(foundByIdentifierBar, [
            new TransactionEvent({
                identifier: "bar",
                topics: [new TransactionEventTopic("c")],
            }),
        ]);

        assert.deepEqual(foundByTopic, [
            new TransactionEvent({
                identifier: "foo",
                topics: [new TransactionEventTopic("b")],
            }),
        ]);
    });
});
