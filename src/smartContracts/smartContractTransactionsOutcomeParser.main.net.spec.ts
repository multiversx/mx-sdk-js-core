import { assert } from "chai";
import { promises } from "fs";
import { TransactionsConverter } from "../converters/transactionsConverter";
import { createMainnetProvider } from "../testutils/networkProviders";
import { SmartContractTransactionsOutcomeParser } from "./smartContractTransactionsOutcomeParser";

describe("test smart contract transactions outcome parser on mainnet", () => {
    const networkProvider = createMainnetProvider();
    const parser = new SmartContractTransactionsOutcomeParser();
    const converter = new TransactionsConverter();

    it("should parse (execute_success)", async function () {
        this.timeout(3600000);

        const records = await loadRecords("execute_success");

        for (let i = 0; i < records.length; i++) {
            const { hash } = records[i];
            console.log(i, hash);

            const transactionOnNetwork = await networkProvider.getTransaction(hash);
            const transactionOutcome = converter.transactionOnNetworkToOutcome(transactionOnNetwork);
            const parsedOutcomeGivenTransactionOutcome = parser.parseExecute({ transactionOutcome });
            const parsedOutcomeGivenTransactionOnNetwork = parser.parseExecute({ transactionOnNetwork });

            assert.deepEqual(parsedOutcomeGivenTransactionOutcome, parsedOutcomeGivenTransactionOnNetwork);
            assert.equal(parsedOutcomeGivenTransactionOnNetwork.returnCode, "ok");
            assert.equal(parsedOutcomeGivenTransactionOnNetwork.returnMessage, "ok");
        }
    });

    it("should parse (execute_error)", async function () {
        this.timeout(3600000);

        const records = await loadRecords("execute_error");

        for (let i = 0; i < records.length; i++) {
            const { hash } = records[i];
            console.log(i, hash);

            const transactionOnNetwork = await networkProvider.getTransaction(hash);
            const transactionOutcome = converter.transactionOnNetworkToOutcome(transactionOnNetwork);
            const parsedOutcomeGivenTransactionOutcome = parser.parseExecute({ transactionOutcome });
            const parsedOutcomeGivenTransactionOnNetwork = parser.parseExecute({ transactionOnNetwork });

            assert.deepEqual(parsedOutcomeGivenTransactionOutcome, parsedOutcomeGivenTransactionOnNetwork);
            assert.isTrue(parsedOutcomeGivenTransactionOnNetwork.returnCode.length > 0);
            assert.isTrue(parsedOutcomeGivenTransactionOnNetwork.returnMessage.length > 0);
            assert.lengthOf(parsedOutcomeGivenTransactionOnNetwork.values, 0);
        }
    });

    it("should parse (transfer_execute_success)", async function () {
        this.timeout(3600000);

        const records = await loadRecords("transfer_execute_success");

        for (let i = 0; i < records.length; i++) {
            const { hash } = records[i];
            console.log(i, hash);

            const transactionOnNetwork = await networkProvider.getTransaction(hash);
            const transactionOutcome = converter.transactionOnNetworkToOutcome(transactionOnNetwork);
            const parsedOutcomeGivenTransactionOutcome = parser.parseExecute({ transactionOutcome });
            const parsedOutcomeGivenTransactionOnNetwork = parser.parseExecute({ transactionOnNetwork });

            assert.deepEqual(parsedOutcomeGivenTransactionOutcome, parsedOutcomeGivenTransactionOnNetwork);
            assert.equal(parsedOutcomeGivenTransactionOnNetwork.returnCode, "ok");
            assert.equal(parsedOutcomeGivenTransactionOnNetwork.returnMessage, "ok");
        }
    });

    it("should parse (transfer_execute_error)", async function () {
        this.timeout(3600000);

        const records = await loadRecords("transfer_execute_error");

        for (let i = 0; i < records.length; i++) {
            const { hash } = records[i];
            console.log(i, hash);

            const transactionOnNetwork = await networkProvider.getTransaction(hash);
            const transactionOutcome = converter.transactionOnNetworkToOutcome(transactionOnNetwork);
            const parsedOutcomeGivenTransactionOutcome = parser.parseExecute({ transactionOutcome });
            const parsedOutcomeGivenTransactionOnNetwork = parser.parseExecute({ transactionOnNetwork });

            assert.deepEqual(parsedOutcomeGivenTransactionOutcome, parsedOutcomeGivenTransactionOnNetwork);
            assert.isTrue(parsedOutcomeGivenTransactionOnNetwork.returnCode.length > 0);
            assert.isTrue(parsedOutcomeGivenTransactionOnNetwork.returnMessage.length > 0);
            assert.lengthOf(parsedOutcomeGivenTransactionOnNetwork.values, 0);
        }
    });

    it("should parse (relayed_success)", async function () {
        this.timeout(3600000);

        const records = await loadRecords("relayed_success");

        for (let i = 0; i < records.length; i++) {
            const { hash } = records[i];
            console.log(i, hash);

            const transactionOnNetwork = await networkProvider.getTransaction(hash);
            const parsedOutcomeGivenTransactionOnNetwork = parser.parseExecute({ transactionOnNetwork });

            assert.equal(parsedOutcomeGivenTransactionOnNetwork.returnCode, "ok");
            assert.equal(parsedOutcomeGivenTransactionOnNetwork.returnMessage, "ok");
        }
    });

    it("should parse (relayed_error)", async function () {
        this.timeout(3600000);

        const records = await loadRecords("relayed_error");

        for (let i = 0; i < records.length; i++) {
            const { hash } = records[i];
            console.log(i, hash);

            const transactionOnNetwork = await networkProvider.getTransaction(hash);
            const parsedOutcomeGivenTransactionOnNetwork = parser.parseExecute({ transactionOnNetwork });

            assert.isTrue(parsedOutcomeGivenTransactionOnNetwork.returnCode.length > 0);
            assert.isTrue(parsedOutcomeGivenTransactionOnNetwork.returnMessage.length > 0);
            assert.lengthOf(parsedOutcomeGivenTransactionOnNetwork.values, 0);
        }
    });

    it("should parse (multi_transfer_too_much_gas)", async function () {
        this.timeout(3600000);

        const records = await loadRecords("multi_transfer_too_much_gas");

        for (let i = 0; i < records.length; i++) {
            const { hash } = records[i];
            console.log(i, hash);

            const transactionOnNetwork = await networkProvider.getTransaction(hash);
            const transactionOutcome = converter.transactionOnNetworkToOutcome(transactionOnNetwork);
            const parsedOutcomeGivenTransactionOutcome = parser.parseExecute({ transactionOutcome });
            const parsedOutcomeGivenTransactionOnNetwork = parser.parseExecute({ transactionOnNetwork });

            assert.deepEqual(parsedOutcomeGivenTransactionOutcome, parsedOutcomeGivenTransactionOnNetwork);
            assert.equal(parsedOutcomeGivenTransactionOnNetwork.returnCode, "ok");
            assert.equal(parsedOutcomeGivenTransactionOnNetwork.returnMessage, "ok");
            assert.lengthOf(parsedOutcomeGivenTransactionOnNetwork.values, 0);
        }
    });

    async function loadRecords(kind: string): Promise<any[]> {
        const path = "src/testdata/transactions.mainnet.json";
        const content: string = await promises.readFile(path, { encoding: "utf8" });
        const records = JSON.parse(content);
        const recordsFiltered = records.filter((record: any) => record.kind == kind);
        return recordsFiltered;
    }
});
