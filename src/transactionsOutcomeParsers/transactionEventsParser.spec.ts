import {
    ContractResultItem,
    ContractResults,
    TransactionEventData,
    TransactionEvent as TransactionEventOnNetwork,
    TransactionEventTopic,
    TransactionLogs as TransactionLogsOnNetwork,
    TransactionOnNetwork,
} from "@multiversx/sdk-network-providers";
import BigNumber from "bignumber.js";
import { assert } from "chai";
import { Address } from "../address";
import { TransactionsConverter } from "../converters/transactionsConverter";
import { AbiRegistry } from "../smartcontracts";
import { loadAbiRegistry } from "../testutils";
import { TransactionEvent, findEventsByIdentifier } from "./resources";
import { TransactionEventsParser } from "./transactionEventsParser";

describe("test transaction events parser", () => {
    it("parses events (minimalistic)", async function () {
        const parser = new TransactionEventsParser({
            abi: await loadAbiRegistry("src/testdata/esdt-safe.abi.json"),
        });

        const values = parser.parseEvents({
            events: [
                new TransactionEvent({
                    identifier: "transferOverMaxAmount",
                    topics: [Buffer.from("transferOverMaxAmount"), Buffer.from([0x2a]), Buffer.from([0x2b])],
                }),
            ],
        });

        assert.deepEqual(values, [
            {
                batch_id: new BigNumber(42),
                tx_id: new BigNumber(43),
            },
        ]);
    });

    it("parses events", async function () {
        const parser = new TransactionEventsParser({
            abi: await loadAbiRegistry("src/testdata/esdt-safe.abi.json"),
        });

        const transactionsConverter = new TransactionsConverter();
        const transactionOnNetwork = new TransactionOnNetwork({
            nonce: 7,
            contractResults: new ContractResults([
                new ContractResultItem({
                    nonce: 8,
                    data: "@6f6b",
                    logs: new TransactionLogsOnNetwork({
                        events: [
                            new TransactionEventOnNetwork({
                                identifier: "deposit",
                                topics: [
                                    new TransactionEventTopic("ZGVwb3NpdA=="),
                                    new TransactionEventTopic("cmzC1LRt1r10pMhNAnFb+FyudjGMq4G8CefCYdQUmmc="),
                                    new TransactionEventTopic("AAAADFdFR0xELTAxZTQ5ZAAAAAAAAAAAAAAAAWQ="),
                                ],
                                dataPayload: new TransactionEventData(Buffer.from("AAAAAAAAA9sAAAA=", "base64")),
                            }),
                        ],
                    }),
                }),
            ]),
        });

        const transactionOutcome = transactionsConverter.transactionOnNetworkToOutcome(transactionOnNetwork);
        const events = findEventsByIdentifier(transactionOutcome, "deposit");
        const parsed = parser.parseEvents({ events });

        assert.deepEqual(parsed, [
            {
                dest_address: Address.fromBech32("erd1wfkv9495dhtt6a9yepxsyu2mlpw2ua333j4cr0qfulpxr4q5nfnshgyqun"),
                tokens: [
                    {
                        token_identifier: "WEGLD-01e49d",
                        token_nonce: new BigNumber(0),
                        amount: new BigNumber(100),
                    },
                ],
                event_data: {
                    tx_nonce: new BigNumber(987),
                    opt_function: null,
                    opt_arguments: null,
                    opt_gas_limit: null,
                },
            },
        ]);
    });

    it("cannot parse events, when definition is missing", async function () {
        const parser = new TransactionEventsParser({
            abi: await loadAbiRegistry("src/testdata/esdt-safe.abi.json"),
        });

        assert.throws(() => {
            parser.parseEvents({
                events: [
                    new TransactionEvent({
                        identifier: "foobar",
                        topics: [Buffer.from("doFoobar")],
                    }),
                ],
            });
        }, "Invariant failed: [event [doFoobar] not found]");
    });

    it("parses event (with multi-values)", async function () {
        const abi = AbiRegistry.create({
            events: [
                {
                    identifier: "doFoobar",
                    inputs: [
                        {
                            name: "a",
                            type: "multi<u8, utf-8 string, u8, utf-8 string>",
                            indexed: true,
                        },
                        {
                            name: "b",
                            type: "multi<utf-8 string, u8>",
                            indexed: true,
                        },
                        {
                            name: "c",
                            type: "u8",
                            indexed: false,
                        },
                    ],
                },
            ],
        });

        const parser = new TransactionEventsParser({ abi });
        const parsed = parser.parseEvent({
            event: new TransactionEvent({
                identifier: "foobar",
                topics: [
                    Buffer.from("doFoobar"),
                    Buffer.from([42]),
                    Buffer.from("test"),
                    Buffer.from([43]),
                    Buffer.from("test"),
                    Buffer.from("test"),
                    Buffer.from([44]),
                ],
                dataItems: [Buffer.from([42])],
            }),
        });

        assert.deepEqual(parsed, {
            a: [new BigNumber(42), "test", new BigNumber(43), "test"],
            b: ["test", new BigNumber(44)],
            c: new BigNumber(42),
        });
    });
});
