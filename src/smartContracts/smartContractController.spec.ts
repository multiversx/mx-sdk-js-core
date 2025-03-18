import BigNumber from "bignumber.js";
import { assert } from "chai";
import { Abi, BigUIntValue, BooleanValue, BytesValue, Tuple, U16Value, U64Value } from "../abi";
import { Address, SmartContractQueryResponse } from "../core";
import { MockNetworkProvider, loadAbiRegistry } from "../testutils";
import { bigIntToBuffer } from "../tokenOperations/codec";
import { SmartContractController } from "./smartContractController";

describe("test smart contract queries controller", () => {
    describe("createQuery", () => {
        it("works without ABI, when arguments are buffers", function () {
            const controller = new SmartContractController({
                chainID: this.chainId,
                networkProvider: this.networkProvider,
            });

            const query = controller.createQuery({
                contract: Address.empty(),
                function: "bar",
                arguments: [bigIntToBuffer(42), Buffer.from("abba")],
            });

            assert.deepEqual(query.contract, Address.empty());
            assert.equal(query.function, "bar");
            assert.deepEqual(query.arguments, [bigIntToBuffer(42), Buffer.from("abba")]);
        });

        it("works without ABI, when arguments are typed values", function () {
            const controller = new SmartContractController({
                chainID: this.chainId,
                networkProvider: this.networkProvider,
            });

            const query = controller.createQuery({
                contract: Address.empty(),
                function: "bar",
                arguments: [new BigUIntValue(42), BytesValue.fromUTF8("abba")],
            });

            assert.deepEqual(query.contract, Address.empty());
            assert.equal(query.function, "bar");
            assert.deepEqual(query.arguments, [bigIntToBuffer(42), Buffer.from("abba")]);
        });

        it("fails without ABI, when arguments aren't buffers, nor typed values", function () {
            const controller = new SmartContractController({
                chainID: this.chainId,
                networkProvider: this.networkProvider,
            });

            assert.throws(() => {
                controller.createQuery({
                    contract: Address.empty(),
                    function: "bar",
                    arguments: [42, "abba"],
                });
            }, "cannot encode arguments");
        });

        it("works with ABI, when arguments are native JS objects", async function () {
            const controller = new SmartContractController({
                chainID: this.chainId,
                networkProvider: this.networkProvider,
                abi: await loadAbiRegistry("src/testdata/lottery-esdt.abi.json"),
            });

            const query = controller.createQuery({
                contract: Address.empty(),
                function: "getLotteryInfo",
                arguments: ["myLottery"],
            });

            assert.deepEqual(query.contract, Address.empty());
            assert.equal(query.function, "getLotteryInfo");
            assert.deepEqual(query.arguments, [Buffer.from("myLottery")]);
        });

        it("works with ABI, when arguments typed values", async function () {
            const controller = new SmartContractController({
                chainID: this.chainId,
                networkProvider: this.networkProvider,
                abi: await loadAbiRegistry("src/testdata/lottery-esdt.abi.json"),
            });

            const query = controller.createQuery({
                contract: Address.empty(),
                function: "getLotteryInfo",
                arguments: [BytesValue.fromUTF8("myLottery")],
            });

            assert.deepEqual(query.contract, Address.empty());
            assert.equal(query.function, "getLotteryInfo");
            assert.deepEqual(query.arguments, [Buffer.from("myLottery")]);
        });

        it("works with ABI, with mixed arguments", async function () {
            const abi = Abi.create({
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

            const controller = new SmartContractController({
                chainID: this.chainId,
                networkProvider: this.networkProvider,
                abi: abi,
            });

            const query = controller.createQuery({
                contract: Address.empty(),
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

            assert.deepEqual(query.contract, Address.empty());
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

            const controller = new SmartContractController({
                chainID: this.chainId,
                networkProvider: networkProvider,
            });

            networkProvider.mockQueryContractOnFunction(
                "bar",
                new SmartContractQueryResponse({
                    function: "bar",
                    returnDataParts: [Buffer.from("YWJiYQ==", "base64")],
                    returnCode: "ok",
                    returnMessage: "msg",
                }),
            );

            const query = {
                contract: Address.newFromBech32("erd1qqqqqqqqqqqqqpgqvc7gdl0p4s97guh498wgz75k8sav6sjfjlwqh679jy"),
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
            const controller = new SmartContractController({
                chainID: this.chainId,
                networkProvider: this.networkProvider,
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
            const controller = new SmartContractController({
                chainID: this.chainId,
                networkProvider: this.networkProvider,
                abi: await loadAbiRegistry("src/testdata/lottery-esdt.abi.json"),
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

            const [parsed] = controller.parseQueryResponse(response);

            assert.deepEqual(parsed, {
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
