import { ContractResultItem, ContractResults, TransactionOnNetwork } from "@multiversx/sdk-network-providers";
import { assert } from "chai";
import { TransactionsConverter } from "../converters/transactionsConverter";
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
        assert.equal(parsed.returnCode, "ok");
        assert.equal(parsed.returnMessage, "ok");
    });
});
