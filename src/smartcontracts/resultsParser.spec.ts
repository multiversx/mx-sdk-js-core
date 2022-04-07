import * as fs from "fs";
import path from "path";
import { assert } from "chai";
import { BigUIntType, BigUIntValue, EndpointDefinition, EndpointModifiers, EndpointParameterDefinition } from "./typesystem";
import { BytesType, BytesValue } from "./typesystem/bytes";
import { ReturnCode } from "./returnCode";
import { ResultsParser } from "./resultsParser";
import { Nonce } from "../nonce";
import { TransactionHash } from "../transaction";
import { Address } from "../address";
import { Logger, LogLevel } from "../logger";
import { ITransactionOnNetwork } from "../interfaceOfNetwork";
import { MockTransactionEventTopic } from "../testutils/networkProviders";

const KnownReturnCodes: string[] = [
    ReturnCode.None.valueOf(), 
    ReturnCode.Ok.valueOf(), 
    ReturnCode.FunctionNotFound.valueOf(),
    ReturnCode.FunctionWrongSignature.valueOf(),
    ReturnCode.ContractNotFound.valueOf(), 
    ReturnCode.UserError.valueOf(), 
    ReturnCode.OutOfGas.valueOf(),
    ReturnCode.AccountCollision.valueOf(), 
    ReturnCode.OutOfFunds.valueOf(),
    ReturnCode.CallStackOverFlow.valueOf(), ReturnCode.ContractInvalid.valueOf(),
    ReturnCode.ExecutionFailed.valueOf(),
    // Returned by protocol, not by VM:
    "insufficient funds",
    "operation in account not permitted not the owner of the account",
    "sending value to non payable contract",
    "invalid receiver address"
];

describe("test smart contract results parser", () => {
    let parser = new ResultsParser();

    it("should parse query response", async () => {
        let endpointModifiers = new EndpointModifiers("", []);
        let outputParameters = [
            new EndpointParameterDefinition("a", "a", new BigUIntType()),
            new EndpointParameterDefinition("b", "b", new BytesType())
        ];
        let endpoint = new EndpointDefinition("foo", [], outputParameters, endpointModifiers);

        let queryResponse = new ContractQueryResponse({
            returnData: [
                Buffer.from([42]).toString("base64"),
                Buffer.from("abba", "hex").toString("base64")
            ],
            returnCode: ReturnCode.Ok,
            returnMessage: "foobar"
        });

        let bundle = parser.parseQueryResponse(queryResponse, endpoint);
        assert.deepEqual(bundle.returnCode, ReturnCode.Ok);
        assert.equal(bundle.returnMessage, "foobar");
        assert.deepEqual(bundle.firstValue, new BigUIntValue(42));
        assert.deepEqual(bundle.secondValue, BytesValue.fromHex("abba"));
        assert.lengthOf(bundle.values, 2);
    });

    it("should parse contract outcome", async () => {
        let endpointModifiers = new EndpointModifiers("", []);
        let outputParameters = [
            new EndpointParameterDefinition("a", "a", new BigUIntType()),
            new EndpointParameterDefinition("b", "b", new BytesType())
        ];
        let endpoint = new EndpointDefinition("foo", [], outputParameters, endpointModifiers);

        let transactionOnNetwork = new TransactionOnNetwork({
            contractResults: new ContractResults([
                new ContractResultItem({ nonce: new Nonce(7), data: "@6f6b@2a@abba" })
            ])
        });

        let bundle = parser.parseOutcome(transactionOnNetwork, endpoint);
        assert.deepEqual(bundle.returnCode, ReturnCode.Ok);
        assert.equal(bundle.returnMessage, "ok");
        assert.deepEqual(bundle.firstValue, new BigUIntValue(42));
        assert.deepEqual(bundle.secondValue, BytesValue.fromHex("abba"));
        assert.lengthOf(bundle.values, 2);
    });

    it("should parse contract outcome, on easily found result with return data", async () => {
        let transaction = new TransactionOnNetwork({
            contractResults: new ContractResults([
                new ContractResultItem({
                    nonce: new Nonce(42),
                    data: "@6f6b@03",
                    returnMessage: "foobar"
                })
            ])
        });

        let bundle = parser.parseUntypedOutcome(transaction);
        assert.deepEqual(bundle.returnCode, ReturnCode.Ok);
        assert.equal(bundle.returnMessage, "foobar");
        assert.deepEqual(bundle.values, [Buffer.from("03", "hex")]);
    });

    it("should parse contract outcome, on signal error", async () => {
        let transaction = new TransactionOnNetwork({
            logs: new TransactionLogs(
                new Address(), 
                [
                    new TransactionEvent(
                        new Address(), 
                        "signalError", 
                        [
                            new MockTransactionEventTopic(Buffer.from("something happened").toString("base64"))
                        ],
                        `@${Buffer.from("user error").toString("hex")}@07`
                    )    
                ]
            )
        });

        let bundle = parser.parseUntypedOutcome(transaction);
        assert.deepEqual(bundle.returnCode, ReturnCode.UserError);
        assert.equal(bundle.returnMessage, "something happened");
        assert.deepEqual(bundle.values, [Buffer.from("07", "hex")]);
    });

    it("should parse contract outcome, on too much gas warning", async () => {
        let transaction = new TransactionOnNetwork({
            logs: new TransactionLogs(
                new Address(), 
                [
                    new TransactionEvent(
                        new Address(), 
                        "writeLog", 
                        [
                            new MockTransactionEventTopic("QHRvbyBtdWNoIGdhcyBwcm92aWRlZCBmb3IgcHJvY2Vzc2luZzogZ2FzIHByb3ZpZGVkID0gNTk2Mzg0NTAwLCBnYXMgdXNlZCA9IDczMzAxMA==")
                        ],
                        Buffer.from("QDZmNmI=", "base64").toString()
                    )    
                ]
            )
        });

        let bundle = parser.parseUntypedOutcome(transaction);
        assert.deepEqual(bundle.returnCode, ReturnCode.Ok);
        assert.equal(bundle.returnMessage, "@too much gas provided for processing: gas provided = 596384500, gas used = 733010");
        assert.deepEqual(bundle.values, []);
    });

    // This test should be enabled manually and run against a set of sample transactions.
    // 2022-04-03: test ran against ~1800 transactions sampled from devnet.
    it.skip("should parse real-world contract outcomes", async () => {
        let oldLogLevel = Logger.logLevel;
        Logger.setLevel(LogLevel.Trace);

        let folder = path.resolve(process.env["SAMPLES"] || "SAMPLES")
        let samples = loadRealWorldSamples(folder);

        for (const [transaction, _] of samples) {
            console.log("Transaction:", transaction.hash.toString());

            let bundle = parser.parseUntypedOutcome(transaction);

            console.log("Return code:", bundle.returnCode.toString());
            console.log("Return message:", bundle.returnMessage);
            console.log("Num values:", bundle.values.length);
            console.log("=".repeat(80));

            assert.include(KnownReturnCodes, bundle.returnCode.valueOf());
        }

        Logger.setLevel(oldLogLevel);
    });

    function loadRealWorldSamples(folder: string): [ITransactionOnNetwork, string][] {
        let transactionFiles = fs.readdirSync(folder);
        let samples: [ITransactionOnNetwork, string][] = [];

        for (const file of transactionFiles) {
            let txHash = new TransactionHash(path.basename(file, ".json"));
            let filePath = path.resolve(folder, file);
            let jsonContent: string = fs.readFileSync(filePath, { encoding: "utf8" });
            let json = JSON.parse(jsonContent);
            let payload = json["data"]["transaction"];
            let transaction = TransactionOnNetwork.fromProxyHttpResponse(txHash, payload);

            samples.push([transaction, jsonContent]);
        }

        return samples;
    }
});
