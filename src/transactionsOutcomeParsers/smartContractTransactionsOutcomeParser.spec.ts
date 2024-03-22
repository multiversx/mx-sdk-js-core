import { ContractResultItem, ContractResults, TransactionOnNetwork } from "@multiversx/sdk-network-providers";
import BigNumber from "bignumber.js";
import { assert } from "chai";
import { TransactionsConverter } from "../converters/transactionsConverter";
import { U64Value } from "../smartcontracts";
import { loadAbiRegistry } from "../testutils";
import { SmartContractCallOutcome, TransactionOutcome } from "./resources";
import { SmartContractTransactionsOutcomeParser } from "./smartContractTransactionsOutcomeParser";

describe("test smart contract transactions outcome parser", () => {
    it("parses execute outcome, without ABI (minimalistic)", function () {
        const parser = new SmartContractTransactionsOutcomeParser();

        const parsed = parser.parseExecute({
            transactionOutcome: new TransactionOutcome({
                directSmartContractCallOutcome: new SmartContractCallOutcome({
                    function: "hello",
                    returnCode: "ok",
                    returnMessage: "ok",
                    returnDataParts: [Buffer.from([42])],
                }),
            }),
        });

        assert.deepEqual(parsed.values, [Buffer.from([42])]);
        assert.isUndefined(parsed.valuesTyped);
        assert.equal(parsed.returnCode, "ok");
        assert.equal(parsed.returnMessage, "ok");
    });

    it("parses execute outcome, without ABI", function () {
        const parser = new SmartContractTransactionsOutcomeParser();
        const transactionsConverter = new TransactionsConverter();
        const transactionOnNetwork = new TransactionOnNetwork({
            nonce: 7,
            contractResults: new ContractResults([
                new ContractResultItem({
                    nonce: 8,
                    data: "@6f6b@2a",
                }),
            ]),
        });

        const transactionOutcome = transactionsConverter.transactionOnNetworkToOutcome(transactionOnNetwork);

        const parsed = parser.parseExecute({ transactionOutcome });

        assert.deepEqual(parsed.values, [Buffer.from([42])]);
        assert.isUndefined(parsed.valuesTyped);
        assert.equal(parsed.returnCode, "ok");
        assert.equal(parsed.returnMessage, "ok");
    });

    it("parses execute outcome, with ABI (minimalistic)", async function () {
        const parser = new SmartContractTransactionsOutcomeParser({
            abi: await loadAbiRegistry("src/testdata/answer.abi.json"),
        });

        const parsed = parser.parseExecute({
            transactionOutcome: new TransactionOutcome({
                directSmartContractCallOutcome: new SmartContractCallOutcome({
                    // For the sake of the test, let's say that we've called this function as a transaction, not as a query.
                    function: "getUltimateAnswer",
                    returnCode: "ok",
                    returnMessage: "ok",
                    returnDataParts: [Buffer.from([42])],
                }),
            }),
        });

        // At this moment, U64Value.valueOf() returns a BigNumber. This might change in the future.
        assert.deepEqual(parsed.values, [new BigNumber("42")]);
        assert.deepEqual(parsed.valuesTyped, [new U64Value(42)]);
        assert.equal(parsed.returnCode, "ok");
        assert.equal(parsed.returnMessage, "ok");
    });

    it("parses execute outcome, with ABI", async function () {
        const parser = new SmartContractTransactionsOutcomeParser({
            abi: await loadAbiRegistry("src/testdata/answer.abi.json"),
        });

        const transactionsConverter = new TransactionsConverter();
        const transactionOnNetwork = new TransactionOnNetwork({
            nonce: 7,
            function: "getUltimateAnswer",
            contractResults: new ContractResults([
                new ContractResultItem({
                    nonce: 8,
                    data: "@6f6b@2a",
                }),
            ]),
        });

        const transactionOutcome = transactionsConverter.transactionOnNetworkToOutcome(transactionOnNetwork);
        const parsed = parser.parseExecute({ transactionOutcome });

        // At this moment, U64Value.valueOf() returns a BigNumber. This might change in the future.
        assert.deepEqual(parsed.values, [new BigNumber("42")]);
        assert.deepEqual(parsed.valuesTyped, [new U64Value(42)]);
        assert.equal(parsed.returnCode, "ok");
        assert.equal(parsed.returnMessage, "ok");
    });

    it("cannot parse execute outcome, with ABI, when function name is missing", async function () {
        const parser = new SmartContractTransactionsOutcomeParser({
            abi: await loadAbiRegistry("src/testdata/answer.abi.json"),
        });

        const transactionsConverter = new TransactionsConverter();
        const transactionOnNetwork = new TransactionOnNetwork({
            nonce: 7,
            contractResults: new ContractResults([
                new ContractResultItem({
                    nonce: 8,
                    data: "@6f6b@2a",
                }),
            ]),
        });

        const transactionOutcome = transactionsConverter.transactionOnNetworkToOutcome(transactionOnNetwork);

        assert.throws(() => {
            parser.parseExecute({ transactionOutcome });
        }, 'Function name is not available in the transaction outcome, thus endpoint definition (ABI) cannot be picked (for parsing). Maybe provide the "function" parameter explicitly?');
    });
});
