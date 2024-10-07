import { assert } from "chai";
import { TransactionsConverter } from "../converters/transactionsConverter";
import { createDevnetProvider } from "../testutils/networkProviders";
import { SmartContractTransactionsOutcomeParser } from "./smartContractTransactionsOutcomeParser";

describe("test smart contract transactions outcome parser", () => {
    const networkProvider = createDevnetProvider();
    const parser = new SmartContractTransactionsOutcomeParser();
    const transactionsConverter = new TransactionsConverter();

    it("should parse outcome of relayed V3 inner transactions (1)", async () => {
        const transactionHash = "c798e8c03d93aa4e3425f63fe020572304305e2017b1053c9f4e56f2c46bafd7";
        const transactionOnNetwork = await networkProvider.getTransaction(transactionHash);
        const outcomes = transactionsConverter.transactionOnNetworkToOutcomesOfInnerTransactions(transactionOnNetwork);

        const parsed = parser.parseExecute({ transactionOutcome: outcomes[0] });
        assert.deepEqual(parsed.values, [Buffer.from([1])]);
        assert.equal(parsed.returnCode, "ok");
        assert.equal(parsed.returnMessage, "ok");
    });

    it("should parse outcome of relayed V3 inner transactions (2)", async () => {
        const transactionHash = "eaf80014f1b413191ac6a04a81c3751c5563aff246021f4f7c4ba9723fa3b536";
        const transactionOnNetwork = await networkProvider.getTransaction(transactionHash);
        const outcomes = transactionsConverter.transactionOnNetworkToOutcomesOfInnerTransactions(transactionOnNetwork);

        let parsed = parser.parseExecute({ transactionOutcome: outcomes[0] });
        assert.deepEqual(parsed.values, [Buffer.from([42]), Buffer.from([43]), Buffer.from([44])]);
        assert.equal(parsed.returnCode, "ok");
        assert.equal(parsed.returnMessage, "ok");

        parsed = parser.parseExecute({ transactionOutcome: outcomes[1] });
        assert.deepEqual(parsed.values, []);
        assert.equal(parsed.returnCode, "");
        assert.equal(parsed.returnMessage, "");
    });

    it("should parse outcome of relayed V3 inner transactions (3)", async () => {
        const transactionHash = "d241307c92c66cfe8ce723656d8b2c47a4a4f9e457eec305155debba6c92ca1b";
        const transactionOnNetwork = await networkProvider.getTransaction(transactionHash);
        const outcomes = transactionsConverter.transactionOnNetworkToOutcomesOfInnerTransactions(transactionOnNetwork);

        let parsed = parser.parseExecute({ transactionOutcome: outcomes[0] });
        assert.deepEqual(parsed.values, [Buffer.from([42]), Buffer.from([43]), Buffer.from([44])]);
        assert.equal(parsed.returnCode, "ok");
        assert.equal(parsed.returnMessage, "ok");

        // Signal error is not recoverable (for the moment).
        parsed = parser.parseExecute({ transactionOutcome: outcomes[1] });
        assert.deepEqual(parsed.values, []);
        assert.equal(parsed.returnCode, "");
        assert.equal(parsed.returnMessage, "");
    });

    it("should parse outcome of relayed V3 inner transactions (4)", async () => {
        const transactionHash = "4bb3bc0f069fe4cf6a19750db026cca0968b224a59a2bfe6eee834c19d73cb80";
        const transactionOnNetwork = await networkProvider.getTransaction(transactionHash);
        const outcomes = transactionsConverter.transactionOnNetworkToOutcomesOfInnerTransactions(transactionOnNetwork);

        let parsed = parser.parseExecute({ transactionOutcome: outcomes[0] });
        assert.deepEqual(parsed.values, [Buffer.from([42]), Buffer.from([43]), Buffer.from([44])]);
        assert.equal(parsed.returnCode, "ok");
        assert.equal(parsed.returnMessage, "ok");

        // Signal error is not recoverable (for the moment).
        parsed = parser.parseExecute({ transactionOutcome: outcomes[1] });
        assert.deepEqual(parsed.values, [Buffer.from([42]), Buffer.from([43]), Buffer.from([44])]);
        assert.equal(parsed.returnCode, "ok");
        assert.equal(parsed.returnMessage, "ok");
    });
});

