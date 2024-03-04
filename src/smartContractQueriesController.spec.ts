import { assert } from "chai";
import { SmartContractQueriesController } from "./smartContractQueriesController";
import { BigUIntValue, BytesValue } from "./smartcontracts";
import { bigIntToBuffer } from "./smartcontracts/codec/utils";
import { MockNetworkProvider } from "./testutils";

describe("test smart contract queries controller", () => {
    const networkProvider = new MockNetworkProvider();

    describe("createQuery", () => {
        it("should work without ABI, when arguments are buffers", function () {
            const controller = new SmartContractQueriesController({
                networkProvider: networkProvider,
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
                networkProvider: networkProvider,
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
                networkProvider: networkProvider,
            });

            assert.throws(() => {
                controller.createQuery({
                    contract: "erd1foo",
                    function: "bar",
                    arguments: [42, "abba"],
                });
            }, "cannot encode arguments");
        });
    });
});
