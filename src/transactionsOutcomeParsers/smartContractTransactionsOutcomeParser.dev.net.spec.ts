import { assert } from "chai";
import { TransactionsConverter } from "../converters/transactionsConverter";
import { ProxyNetworkProvider } from "../networkProviders";
import { SmartContractTransactionsOutcomeParser } from "./smartContractTransactionsOutcomeParser";

describe("test smart contract transactions outcome parser", () => {
    it("should parse outcome of relayed V3 inner transactions", async () => {
        const parser = new SmartContractTransactionsOutcomeParser();
        const networkProvider = new ProxyNetworkProvider("https://devnet-gateway.multiversx.com");
        const transactionsConverter = new TransactionsConverter();

        // (1)
        let transactionHash = "c798e8c03d93aa4e3425f63fe020572304305e2017b1053c9f4e56f2c46bafd7";
        let transactionOnNetwork = await networkProvider.getTransaction(transactionHash);
        let outcomes = transactionsConverter.transactionOnNetworkToOutcomesOfInnerTransactions(transactionOnNetwork);

        let parsed = parser.parseExecute({ transactionOutcome: outcomes[0] });
        assert.deepEqual(parsed.values, [Buffer.from([1])]);
        assert.equal(parsed.returnCode, "ok");
        assert.equal(parsed.returnMessage, "ok");

        // (2)
        transactionHash = "eaf80014f1b413191ac6a04a81c3751c5563aff246021f4f7c4ba9723fa3b536";
        transactionOnNetwork = await networkProvider.getTransaction(transactionHash);
        outcomes = transactionsConverter.transactionOnNetworkToOutcomesOfInnerTransactions(transactionOnNetwork);

        parsed = parser.parseExecute({ transactionOutcome: outcomes[0] });
        assert.deepEqual(parsed.values, [Buffer.from([42]), Buffer.from([43]), Buffer.from([44])]);
        assert.equal(parsed.returnCode, "ok");
        assert.equal(parsed.returnMessage, "ok");

        parsed = parser.parseExecute({ transactionOutcome: outcomes[1] });
        assert.deepEqual(parsed.values, []);
        assert.equal(parsed.returnCode, "");
        assert.equal(parsed.returnMessage, "");
    });
});
