import BigNumber from "bignumber.js";
import { assert } from "chai";
import { Address, TransactionEvent, TransactionLogs, TransactionOnNetwork } from "../core";
import { b64TopicsToBytes, loadAbiRegistry } from "../testutils";
import { SmartContractResult } from "../transactionsOutcomeParsers";
import { SmartContractTransactionsOutcomeParser } from "./smartContractTransactionsOutcomeParser";

describe("test smart contract transactions outcome parser", () => {
    it("parses deploy outcome", async function () {
        const contract = Address.newFromBech32("erd1qqqqqqqqqqqqqpgqqacl85rd0gl2q8wggl8pwcyzcr4fflc5d8ssve45cj");
        const deployer = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const codeHash = Buffer.from("abba", "hex");

        const parser = new SmartContractTransactionsOutcomeParser();

        const transactionOnNetwork = new TransactionOnNetwork({
            nonce: 7n,
            logs: new TransactionLogs({
                events: [
                    new TransactionEvent({
                        identifier: "SCDeploy",
                        topics: [
                            new Uint8Array(Buffer.from(contract.getPublicKey().toString("base64"), "base64")),
                            new Uint8Array(Buffer.from(deployer.getPublicKey().toString("base64"), "base64")),
                            new Uint8Array(Buffer.from(codeHash.toString("base64"), "base64")),
                        ],
                    }),
                ],
            }),
            smartContractResults: [new SmartContractResult({ data: Buffer.from("@6f6b") })],
        });

        const parsed = parser.parseDeploy({ transactionOnNetwork });

        assert.equal(parsed.returnCode, "ok");
        assert.equal(parsed.returnMessage, "ok");
        assert.deepEqual(parsed.contracts, [
            {
                address: contract,
                ownerAddress: deployer,
                codeHash: codeHash,
            },
        ]);
    });

    it("parses deploy outcome (with error)", async function () {
        const deployer = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");

        const parser = new SmartContractTransactionsOutcomeParser();

        const transactionOnNetwork = new TransactionOnNetwork({
            nonce: 7n,
            logs: new TransactionLogs({
                events: [
                    new TransactionEvent({
                        identifier: "signalError",
                        topics: b64TopicsToBytes([
                            deployer.getPublicKey().toString("base64"),
                            Buffer.from("wrong number of arguments").toString("base64"),
                        ]),
                        data: Buffer.from("QDc1NzM2NTcyMjA2NTcyNzI2Zjcy", "base64"),
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
            nonce: 7n,
            smartContractResults: [new SmartContractResult({ data: Buffer.from("@6f6b@2a") })],
        });

        const parsed = parser.parseExecute({ transactionOnNetwork });

        assert.deepEqual(parsed.values, [Buffer.from([42])]);
        assert.equal(parsed.returnCode, "ok");
        assert.equal(parsed.returnMessage, "ok");
    });

    it("parses execute outcome, with ABI", async function () {
        const parser = new SmartContractTransactionsOutcomeParser({
            abi: await loadAbiRegistry("src/testdata/answer.abi.json"),
        });

        const transactionOnNetwork = new TransactionOnNetwork({
            nonce: 7n,
            function: "getUltimateAnswer",
            smartContractResults: [new SmartContractResult({ data: Buffer.from("QDZmNmJAMmE=", "base64") })],
        });

        const parsed = parser.parseExecute({ transactionOnNetwork });

        // At this moment, U64Value.valueOf() returns a BigNumber. This might change in the future.
        assert.deepEqual(parsed.values, [new BigNumber("42")]);
        assert.equal(parsed.returnCode, "ok");
        assert.equal(parsed.returnMessage, "ok");
    });

    it("cannot parse execute outcome, with ABI, when function name is missing", async function () {
        const parser = new SmartContractTransactionsOutcomeParser({
            abi: await loadAbiRegistry("src/testdata/answer.abi.json"),
        });

        const transactionOnNetwork = new TransactionOnNetwork({
            nonce: 7n,
            smartContractResults: [new SmartContractResult({ data: Buffer.from("@6f6b@2a") })],
        });

        assert.throws(() => {
            parser.parseExecute({ transactionOnNetwork });
        }, 'Function name is not available in the transaction, thus endpoint definition (ABI) cannot be picked (for parsing). Maybe provide the "function" parameter explicitly?');
    });
});
