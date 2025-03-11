import { assert } from "chai";
import { Address } from "../core";
import { createDevnetProvider } from "../testutils/networkProviders";
import { SmartContractTransactionsOutcomeParser } from "./smartContractTransactionsOutcomeParser";

describe("test smart contract transactions outcome parser on devnet", () => {
    const networkProvider = createDevnetProvider();
    const parser = new SmartContractTransactionsOutcomeParser();

    it("should parse outcome of deploy transactions (1)", async () => {
        const transactionHash = "5d2ff2af8eb3fe7f2acb7e29c0436854b4c6c44de02878b6afff582888024a55";
        const transactionOnNetwork = await networkProvider.getTransaction(transactionHash);
        const parsedGivenTransactionOnNetwork = parser.parseDeploy({ transactionOnNetwork });

        assert.equal(parsedGivenTransactionOnNetwork.returnCode, "ok");
        assert.deepEqual(parsedGivenTransactionOnNetwork.contracts, [
            {
                address: Address.newFromBech32("erd1qqqqqqqqqqqqqpgqpayq2es08gq8798xhnpr0kzgn7495qt5q6uqd7lpwf"),
                ownerAddress: Address.newFromBech32("erd1tn62hjp72rznp8vq0lplva5csav6rccpqqdungpxtqz0g2hcq6uq9k4cc6"),
                codeHash: Buffer.from("c876625ec34a04445cfd99067777ebe488afdbc6899cd958f4c1d36107ca02d9", "hex"),
            },
        ]);
    });

    it("should parse outcome of deploy transactions (2)", async () => {
        const transactionHash = "76683e926dad142fc9651afca208487f2a80d327fc87e5c876eec9d028196352";
        const transactionOnNetwork = await networkProvider.getTransaction(transactionHash);
        const parsedGivenTransactionOnNetwork = parser.parseDeploy({ transactionOnNetwork });

        assert.equal(parsedGivenTransactionOnNetwork.returnCode, "execution failed");
        assert.lengthOf(parsedGivenTransactionOnNetwork.contracts, 0);
    });
});
