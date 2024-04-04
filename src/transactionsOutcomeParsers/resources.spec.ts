import { assert } from "chai";
import {
    SmartContractResult,
    TransactionEvent,
    TransactionLogs,
    TransactionOutcome,
    findEventsByFirstTopic,
    findEventsByIdentifier,
} from "./resources";

describe("test resources", () => {
    it("finds events by identifier, by first topic", async function () {
        const outcome = new TransactionOutcome({
            logs: new TransactionLogs({
                events: [
                    new TransactionEvent({
                        identifier: "foo",
                        topics: [Buffer.from("a")],
                    }),
                ],
            }),
            smartContractResults: [
                new SmartContractResult({
                    logs: new TransactionLogs({
                        events: [
                            new TransactionEvent({
                                identifier: "foo",
                                topics: [Buffer.from("b")],
                            }),
                            new TransactionEvent({
                                identifier: "bar",
                                topics: [Buffer.from("c")],
                            }),
                        ],
                    }),
                }),
            ],
        });

        const foundByIdentifierFoo = findEventsByIdentifier(outcome, "foo");
        const foundByIdentifierBar = findEventsByIdentifier(outcome, "bar");
        const foundByTopic = findEventsByFirstTopic(outcome, "b");

        assert.deepEqual(foundByIdentifierFoo, [
            new TransactionEvent({
                identifier: "foo",
                topics: [Buffer.from("a")],
            }),
            new TransactionEvent({
                identifier: "foo",
                topics: [Buffer.from("b")],
            }),
        ]);

        assert.deepEqual(foundByIdentifierBar, [
            new TransactionEvent({
                identifier: "bar",
                topics: [Buffer.from("c")],
            }),
        ]);

        assert.deepEqual(foundByTopic, [
            new TransactionEvent({
                identifier: "foo",
                topics: [Buffer.from("b")],
            }),
        ]);
    });
});
