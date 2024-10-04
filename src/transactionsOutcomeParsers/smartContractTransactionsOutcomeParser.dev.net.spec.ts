import { assert } from "chai";
import { TransactionsConverter } from "../converters/transactionsConverter";
import { ProxyNetworkProvider } from "../networkProviders";
import { SmartContractTransactionsOutcomeParser } from "./smartContractTransactionsOutcomeParser";

describe("test smart contract transactions outcome parser", () => {
    it("should parse outcome of relayed V3 inner transactions", async () => {
        const parser = new SmartContractTransactionsOutcomeParser();

        const networkProvider = new ProxyNetworkProvider("https://devnet-gateway.multiversx.com");
        const transactionsConverter = new TransactionsConverter();

        const transactionOnNetwork = await networkProvider.getTransaction(
            "c798e8c03d93aa4e3425f63fe020572304305e2017b1053c9f4e56f2c46bafd7",
        );

        const outcomes = transactionsConverter.transactionOnNetworkToOutcomesOfInnerTransactions(transactionOnNetwork);
        const outcome = outcomes[0];
        const parsed = parser.parseExecute({ transactionOutcome: outcome });

        assert.deepEqual(parsed.values, [Buffer.from([1])]);
        assert.equal(parsed.returnCode, "ok");
        assert.equal(parsed.returnMessage, "ok");
    });
});
