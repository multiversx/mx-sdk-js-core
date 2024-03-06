import { ContractQueryResponse } from "@multiversx/sdk-network-providers";
import BigNumber from "bignumber.js";
import { assert } from "chai";
import { SmartContractQueriesController } from "./smartContractQueriesController";
import { SmartContractQueryResponse } from "./smartContractQuery";
import { AbiRegistry, BigUIntValue, BooleanValue, BytesValue, Tuple, U16Value, U64Value } from "./smartcontracts";
import { bigIntToBuffer } from "./smartcontracts/codec/utils";
import { MockNetworkProvider, loadAbiRegistry } from "./testutils";
import { SmartContractQueriesAdaptor } from "./adaptors/smartContractQueriesAdaptor";

describe("test smart contract queries controller", () => {
    describe("createQuery", () => {
        it("works without ABI, when arguments are buffers", function () {
            const adapter = new SmartContractQueriesAdaptor({ networkProvider: new MockNetworkProvider() });
            const controller = new SmartContractQueriesController({
                queryRunner: adapter,
            });

            const query = controller.createQuery({
                contract: "erd1foo",
                function: "bar",
                arguments: [bigIntToBuffer(42), Buffer.from("abba")],
            });

            assert.equal(query.contract, "erd1foo");
            assert.equal(query.function, "bar");
            assert.deepEqual(query.arguments, [bigIntToBuffer(42), Buffer.from("abba")]);
        });

        it("works without ABI, when arguments are typed values", function () {
            const adapter = new SmartContractQueriesAdaptor({ networkProvider: new MockNetworkProvider() });
            const controller = new SmartContractQueriesController({
                queryRunner: adapter,
            });

            const query = controller.createQuery({
                contract: "erd1foo",
                function: "bar",
                arguments: [new BigUIntValue(42), BytesValue.fromUTF8("abba")],
            });

            assert.equal(query.contract, "erd1foo");
            assert.equal(query.function, "bar");
            assert.deepEqual(query.arguments, [bigIntToBuffer(42), Buffer.from("abba")]);
        });

        it("fails without ABI, when arguments aren't buffers, nor typed values", function () {
            const adapter = new SmartContractQueriesAdaptor({ networkProvider: new MockNetworkProvider() });
            const controller = new SmartContractQueriesController({
                queryRunner: adapter,
            });

            assert.throws(() => {
                controller.createQuery({
                    contract: "erd1foo",
                    function: "bar",
                    arguments: [42, "abba"],
                });
            }, "cannot encode arguments");
        });

        it("works with ABI, when arguments are native JS objects", async function () {
            const adapter = new SmartContractQueriesAdaptor({
                abi: await loadAbiRegistry("src/testdata/lottery-esdt.abi.json"),
                networkProvider: new MockNetworkProvider(),
            });
            const controller = new SmartContractQueriesController({
                queryRunner: adapter,
            });

            const query = controller.createQuery({
                contract: "erd1foo",
                function: "getLotteryInfo",
                arguments: ["myLottery"],
            });

            assert.equal(query.contract, "erd1foo");
            assert.equal(query.function, "getLotteryInfo");
            assert.deepEqual(query.arguments, [Buffer.from("myLottery")]);
        });

        it("works with ABI, when arguments typed values", async function () {
            const adapter = new SmartContractQueriesAdaptor({
                abi: await loadAbiRegistry("src/testdata/lottery-esdt.abi.json"),
                networkProvider: new MockNetworkProvider(),
            });
            const controller = new SmartContractQueriesController({
                queryRunner: adapter,
            });

            const query = controller.createQuery({
                contract: "erd1foo",
                function: "getLotteryInfo",
                arguments: [BytesValue.fromUTF8("myLottery")],
            });

            assert.equal(query.contract, "erd1foo");
            assert.equal(query.function, "getLotteryInfo");
            assert.deepEqual(query.arguments, [Buffer.from("myLottery")]);
        });

        it("works with ABI, with mixed arguments", async function () {
            const abi = AbiRegistry.create({
                endpoints: [
                    {
                        name: "bar",
                        inputs: [
                            {
                                type: "tuple<u16,bool>",
                            },
                            {
                                type: "tuple<u8,Option<bool>>",
                            },
                            {
                                type: "List<tuple<u8,bool>>",
                            },
                            {
                                type: "u64",
                            },
                        ],
                        outputs: [],
                    },
                ],
            });

            const adapter = new SmartContractQueriesAdaptor({
                abi: abi,
                networkProvider: new MockNetworkProvider(),
            });
            const controller = new SmartContractQueriesController({
                queryRunner: adapter,
            });

            const query = controller.createQuery({
                contract: "erd1foo",
                function: "bar",
                arguments: [
                    // Typed value
                    Tuple.fromItems([new U16Value(42), new BooleanValue(true)]),
                    // Native JS objects
                    [43, false],
                    [
                        [44, false],
                        [45, true],
                    ],
                    // Typed value
                    new U64Value(46),
                ],
            });

            assert.equal(query.contract, "erd1foo");
            assert.equal(query.function, "bar");
            assert.deepEqual(query.arguments, [
                Buffer.from("002a01", "hex"),
                Buffer.from("2b0100", "hex"),
                Buffer.from("2c002d01", "hex"),
                Buffer.from("2e", "hex"),
            ]);
        });
    });

    describe("runQuery", () => {
        it("calls queryContract on the network provider", async function () {
            const networkProvider = new MockNetworkProvider();
            const adapter = new SmartContractQueriesAdaptor({
                networkProvider: networkProvider,
            });
            const controller = new SmartContractQueriesController({
                queryRunner: adapter,
            });

            networkProvider.mockQueryContractOnFunction(
                "bar",
                new ContractQueryResponse({
                    returnData: [Buffer.from("abba").toString("base64")],
                    returnCode: "ok",
                }),
            );

            const query = {
                contract: "erd1qqqqqqqqqqqqqpgqvc7gdl0p4s97guh498wgz75k8sav6sjfjlwqh679jy",
                function: "bar",
                arguments: [],
            };

            const response = await controller.runQuery(query);

            assert.equal(response.returnCode, "ok");
            assert.deepEqual(response.returnDataParts, [Buffer.from("abba")]);
        });
    });

    describe("parseQueryResponse", () => {
        it("works without ABI", function () {
            const adapter = new SmartContractQueriesAdaptor({
                networkProvider: new MockNetworkProvider(),
            });
            const controller = new SmartContractQueriesController({
                queryRunner: adapter,
            });

            const response = new SmartContractQueryResponse({
                function: "bar",
                returnCode: "ok",
                returnMessage: "ok",
                returnDataParts: [Buffer.from("abba")],
            });

            const parsed = controller.parseQueryResponse(response);

            assert.deepEqual(parsed, [Buffer.from("abba")]);
        });

        it("works with ABI", async function () {
            const adapter = new SmartContractQueriesAdaptor({
                abi: await loadAbiRegistry("src/testdata/lottery-esdt.abi.json"),
                networkProvider: new MockNetworkProvider(),
            });
            const controller = new SmartContractQueriesController({
                queryRunner: adapter,
            });

            const response = new SmartContractQueryResponse({
                function: "getLotteryInfo",
                returnCode: "ok",
                returnMessage: "ok",
                returnDataParts: [
                    Buffer.from(
                        "0000000b6c75636b792d746f6b656e000000010100000000000000005fc2b9dbffffffff00000001640000000a140ec80fa7ee88000000",
                        "hex",
                    ),
                ],
            });

            const parsed = controller.parseQueryResponse(response);
            const plainData = parsed[0].valueOf();

            assert.deepEqual(plainData, {
                token_identifier: "lucky-token",
                ticket_price: new BigNumber("1"),
                tickets_left: new BigNumber(0),
                deadline: new BigNumber("0x000000005fc2b9db", 16),
                max_entries_per_user: new BigNumber(0xffffffff),
                prize_distribution: Buffer.from([0x64]),
                prize_pool: new BigNumber("94720000000000000000000"),
            });
        });
    });
});
