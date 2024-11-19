import BigNumber from "bignumber.js";
import { assert } from "chai";
import { Address } from "../address";
import {
    ContractResultItem,
    ContractResults,
    TransactionEventOnNetwork,
    TransactionEventTopic,
    TransactionLogsOnNetwork,
} from "../networkProviders";
import { loadAbiRegistry } from "../testutils";
import { TransactionOnNetwork } from "../transactions";
import { SmartContractTransactionsOutcomeParser } from "./smartContractTransactionsOutcomeParser";

describe("test smart contract transactions outcome parser", () => {
    it("parses deploy outcome", async function () {
        const contract = Address.fromBech32("erd1qqqqqqqqqqqqqpgqqacl85rd0gl2q8wggl8pwcyzcr4fflc5d8ssve45cj");
        const deployer = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const codeHash = Buffer.from("abba", "hex");

        const parser = new SmartContractTransactionsOutcomeParser();

        const transactionOnNetwork = new TransactionOnNetwork({
            nonce: 7,
            logs: new TransactionLogsOnNetwork({
                events: [
                    new TransactionEventOnNetwork({
                        identifier: "SCDeploy",
                        topics: [
                            new TransactionEventTopic(contract.getPublicKey().toString("base64")),
                            new TransactionEventTopic(deployer.getPublicKey().toString("base64")),
                            new TransactionEventTopic(codeHash.toString("base64")),
                        ],
                    }),
                ],
            }),
            contractResults: new ContractResults([
                new ContractResultItem({
                    nonce: 8,
                    data: "@6f6b",
                }),
            ]),
        });

        const parsed = parser.parseDeploy({ transactionOnNetwork });

        assert.equal(parsed.returnCode, "ok");
        assert.equal(parsed.returnMessage, "ok");
        assert.deepEqual(parsed.contracts, [
            {
                address: contract.toBech32(),
                ownerAddress: deployer.toBech32(),
                codeHash: codeHash,
            },
        ]);
    });

    it("parses deploy outcome (with error)", async function () {
        const deployer = Address.fromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");

        const parser = new SmartContractTransactionsOutcomeParser();

        const transactionOnNetwork = new TransactionOnNetwork({
            nonce: 7,
            logs: new TransactionLogsOnNetwork({
                events: [
                    new TransactionEventOnNetwork({
                        identifier: "signalError",
                        topics: [
                            new TransactionEventTopic(deployer.getPublicKey().toString("base64")),
                            new TransactionEventTopic(Buffer.from("wrong number of arguments").toString("base64")),
                        ],
                        data: "@75736572206572726f72",
                    }),
                ],
            }),
        });

        const parsed = parser.parseDeploy({ transactionOnNetwork });

        assert.equal(parsed.returnCode, "user error");
        assert.equal(parsed.returnMessage, "wrong number of arguments");
        assert.deepEqual(parsed.contracts, []);
    });

    it("parses execute outcome, without ABI", function () {
        const parser = new SmartContractTransactionsOutcomeParser();
        const transactionOnNetwork = new TransactionOnNetwork({
            nonce: 7,
            contractResults: new ContractResults([
                new ContractResultItem({
                    nonce: 8,
                    data: "@6f6b@2a",
                }),
            ]),
        });

        const parsed = parser.parseExecute({ transactionOnNetwork });

        assert.deepEqual(parsed.values, [Buffer.from([42])]);
        assert.equal(parsed.returnCode, "ok");
        assert.equal(parsed.returnMessage, "ok");
    });

    it.only("parses execute outcome, with ABI", async function () {
        const parser = new SmartContractTransactionsOutcomeParser({
            abi: await loadAbiRegistry("src/testdata/answer.abi.json"),
        });

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

        const parsed = parser.parseExecute({ transactionOnNetwork });

        // At this moment, U64Value.valueOf() returns a BigNumber. This might change in the future.
        console.log(1111, parsed.values);
        assert.deepEqual(parsed.values, [new BigNumber("42")]);
        assert.equal(parsed.returnCode, "ok");
        assert.equal(parsed.returnMessage, "ok");
    });

    it("cannot parse execute outcome, with ABI, when function name is missing", async function () {
        const parser = new SmartContractTransactionsOutcomeParser({
            abi: await loadAbiRegistry("src/testdata/answer.abi.json"),
        });

        const transactionOnNetwork = new TransactionOnNetwork({
            nonce: 7,
            contractResults: new ContractResults([
                new ContractResultItem({
                    nonce: 8,
                    data: "@6f6b@2a",
                }),
            ]),
        });

        assert.throws(() => {
            parser.parseExecute({ transactionOnNetwork });
        }, 'Function name is not available in the transaction, thus endpoint definition (ABI) cannot be picked (for parsing). Maybe provide the "function" parameter explicitly?');
    });
});
