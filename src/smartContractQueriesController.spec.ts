import { assert } from "chai";
import { SmartContractQueriesController } from "./smartContractQueriesController";
import { AbiRegistry, BigUIntValue, BooleanValue, BytesValue, Tuple, U16Value, U64Value } from "./smartcontracts";
import { bigIntToBuffer } from "./smartcontracts/codec/utils";
import { MockNetworkProvider, loadAbiRegistry } from "./testutils";

describe("test smart contract queries controller", () => {
    describe("createQuery", () => {
        it("should work without ABI, when arguments are buffers", function () {
            const controller = new SmartContractQueriesController({
                networkProvider: new MockNetworkProvider(),
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

        it("should work without ABI, when arguments are typed values", function () {
            const controller = new SmartContractQueriesController({
                networkProvider: new MockNetworkProvider(),
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

        it("should err without ABI, when arguments aren't buffers, nor typed values", function () {
            const controller = new SmartContractQueriesController({
                networkProvider: new MockNetworkProvider(),
            });

            assert.throws(() => {
                controller.createQuery({
                    contract: "erd1foo",
                    function: "bar",
                    arguments: [42, "abba"],
                });
            }, "cannot encode arguments");
        });

        it("should work with ABI, when arguments are native JS objects", async function () {
            const controller = new SmartContractQueriesController({
                networkProvider: new MockNetworkProvider(),
                abi: await loadAbiRegistry("src/testdata/lottery-esdt.abi.json"),
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

        it("should work with ABI, when arguments typed values", async function () {
            const controller = new SmartContractQueriesController({
                networkProvider: new MockNetworkProvider(),
                abi: await loadAbiRegistry("src/testdata/lottery-esdt.abi.json"),
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

        it("should work with ABI, with mixed arguments", async function () {
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

            const controller = new SmartContractQueriesController({
                networkProvider: new MockNetworkProvider(),
                abi: abi,
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
});
