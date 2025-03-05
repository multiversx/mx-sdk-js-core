import BigNumber from "bignumber.js";
import { assert } from "chai";
import { Abi } from "../abi";
import { Address, TransactionEvent, TransactionLogs, TransactionOnNetwork } from "../core";
import { b64TopicsToBytes, loadAbiRegistry } from "../testutils";
import { findEventsByFirstTopic, SmartContractResult } from "./resources";
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
                    topics: b64TopicsToBytes([
                        Buffer.from("transferOverMaxAmount").toString("base64"),
                        Buffer.from([42]).toString("base64"),
                        Buffer.from([43]).toString("base64"),
                    ]),
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

    it("parses events (esdt-safe, deposit)", async function () {
        const parser = new TransactionEventsParser({
            abi: await loadAbiRegistry("src/testdata/esdt-safe.abi.json"),
        });

        const transactionOnNetwork = new TransactionOnNetwork({
            nonce: 7n,
            smartContractResults: [
                new SmartContractResult({
                    data: Buffer.from("@6f6b"),
                    logs: new TransactionLogs({
                        events: [
                            new TransactionEvent({
                                identifier: "deposit",
                                topics: b64TopicsToBytes([
                                    "ZGVwb3NpdA==",
                                    "cmzC1LRt1r10pMhNAnFb+FyudjGMq4G8CefCYdQUmmc=",
                                    "AAAADFdFR0xELTAxZTQ5ZAAAAAAAAAAAAAAAAWQ=",
                                ]),
                                additionalData: [Buffer.from("AAAAAAAAA9sAAAA=", "base64")],
                            }),
                        ],
                    }),
                }),
            ],
        });

        const events = findEventsByFirstTopic(transactionOnNetwork, "deposit");
        const parsed = parser.parseEvents({ events });

        assert.deepEqual(parsed, [
            {
                dest_address: Address.newFromBech32("erd1wfkv9495dhtt6a9yepxsyu2mlpw2ua333j4cr0qfulpxr4q5nfnshgyqun"),
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

    it("parses events (multisig, startPerformAction)", async function () {
        const parser = new TransactionEventsParser({
            abi: await loadAbiRegistry("src/testdata/multisig-full.abi.json"),
        });

        const transactionOnNetwork = new TransactionOnNetwork({
            nonce: 7n,
            smartContractResults: [new SmartContractResult({ data: Buffer.from("@6f6b") })],
            logs: new TransactionLogs({
                events: [
                    new TransactionEvent({
                        identifier: "performAction",
                        topics: b64TopicsToBytes(["c3RhcnRQZXJmb3JtQWN0aW9u"]),
                        additionalData: [
                            Buffer.from(
                                "00000001000000000500000000000000000500d006f73c4221216fa679bc559005584c4f1160e569e1000000000000000003616464000000010000000107000000010139472eff6886771a982f3083da5d421f24c29181e63888228dc81ca60d69e1",
                                "hex",
                            ),
                        ],
                    }),
                ],
            }),
        });

        const events = findEventsByFirstTopic(transactionOnNetwork, "startPerformAction");
        const parsed = parser.parseEvents({ events });

        assert.deepEqual(parsed, [
            {
                data: {
                    action_id: new BigNumber("1"),
                    group_id: new BigNumber("0"),
                    action_data: {
                        name: "SendTransferExecuteEgld",
                        fields: [
                            {
                                to: Address.newFromBech32(
                                    "erd1qqqqqqqqqqqqqpgq6qr0w0zzyysklfneh32eqp2cf383zc89d8sstnkl60",
                                ),
                                egld_amount: new BigNumber("0"),
                                opt_gas_limit: null,
                                endpoint_name: Buffer.from("add"),
                                arguments: [Buffer.from("07", "hex")],
                            },
                        ],
                    },
                    signers: [Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th")],
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
                        topics: b64TopicsToBytes([Buffer.from("doFoobar").toString("base64")]),
                    }),
                ],
            });
        }, "Invariant failed: [event [doFoobar] not found]");
    });

    it("parses event (with multi-values)", async function () {
        const abi = Abi.create({
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
                topics: b64TopicsToBytes([
                    Buffer.from("doFoobar").toString("base64"),
                    Buffer.from([42]).toString("base64"),
                    Buffer.from("test").toString("base64"),
                    Buffer.from([43]).toString("base64"),
                    Buffer.from("test").toString("base64"),
                    Buffer.from("test").toString("base64"),
                    Buffer.from([44]).toString("base64"),
                ]),
                additionalData: [Buffer.from([42])],
            }),
        });

        assert.deepEqual(parsed, {
            a: [new BigNumber(42), "test", new BigNumber(43), "test"],
            b: ["test", new BigNumber(44)],
            c: new BigNumber(42),
        });
    });
});
