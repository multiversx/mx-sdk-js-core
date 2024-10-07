import { assert } from "chai";
import { promises } from "fs";
import { createMainnetProvider } from "../testutils/networkProviders";
import { SmartContractTransactionsOutcomeParser } from "./smartContractTransactionsOutcomeParser";

describe("test smart contract transactions outcome parser on mainnet", () => {
    const networkProvider = createMainnetProvider();
    const parser = new SmartContractTransactionsOutcomeParser();

    it("should parse (1)", async function () {
        this.timeout(3600000);
        await testRecords("src/testdata/transactions_01.mainnet.json");
    });

    it("should parse (2)", async function () {
        this.timeout(3600000);
        await testRecords("src/testdata/transactions_02.mainnet.json");
    });

    it("should parse (3)", async function () {
        this.timeout(3600000);
        await testRecords("src/testdata/transactions_02.mainnet.json");
    });

    async function testRecords(path: string) {
        const content: string = await promises.readFile(path, { encoding: "utf8" });
        const records = JSON.parse(content);

        for (let i = 0; i < records.length; i++) {
            const { hash, kind } = records[i];
            const transactionOnNetwork = await networkProvider.getTransaction(hash);
            const outcome = parser.parseExecute({ transactionOnNetwork });

            console.log(i, hash, kind);
            console.log(hash, transactionOnNetwork.function, outcome.returnCode, outcome.returnMessage, outcome.values);

            if (kind == "simple_move_balance") {
                assert.equal(outcome.returnCode, "");
                assert.equal(outcome.returnMessage, "");
                assert.lengthOf(outcome.values, 0);
            } else if (kind == "relayed_error" || kind == "transfer_execute_error" || kind == "execute_error") {
                assert.isTrue(outcome.returnCode.length > 0);
                assert.isTrue(outcome.returnMessage.length > 0);
                assert.lengthOf(outcome.values, 0);
            } else if (kind == "relayed_success" || kind == "transfer_execute_success" || kind == "execute_success") {
                assert.equal(outcome.returnCode, "ok");
                assert.equal(outcome.returnMessage, "ok");
            } else {
                assert.fail("unknown kind");
            }
        }
    }
});
