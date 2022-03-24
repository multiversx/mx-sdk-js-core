import { assert } from "chai";
import { BigUIntType, BigUIntValue, EndpointDefinition, EndpointModifiers, EndpointParameterDefinition } from "./typesystem";
import { BytesType, BytesValue } from "./typesystem/bytes";
import { QueryResponse } from "./queryResponse";
import { ReturnCode } from "./returnCode";
import { ResultsParser } from "./resultsParser";
import { TransactionOnNetwork } from "../transactionOnNetwork";
import { SmartContractResultItem, SmartContractResults } from "./smartContractResults";
import { Nonce } from "../nonce";

describe("test smart contract results parser", () => {
    let parser = new ResultsParser();

    it("should parse query response", async () => {
        let endpointModifiers = new EndpointModifiers("", []);
        let outputParameters = [
            new EndpointParameterDefinition("a", "a", new BigUIntType()),
            new EndpointParameterDefinition("b", "b", new BytesType())
        ];
        let endpoint = new EndpointDefinition("foo", [], outputParameters, endpointModifiers);

        let queryResponse = new QueryResponse({
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
            results: new SmartContractResults([
                new SmartContractResultItem({ nonce: new Nonce(7), data: "@6f6b@2a@abba" })
            ])
        });

        let bundle = parser.parseOutcome(transactionOnNetwork, endpoint);
        assert.deepEqual(bundle.returnCode, ReturnCode.Ok);
        assert.equal(bundle.returnMessage, "ok");
        assert.deepEqual(bundle.firstValue, new BigUIntValue(42));
        assert.deepEqual(bundle.secondValue, BytesValue.fromHex("abba"));
        assert.lengthOf(bundle.values, 2);
    });
});
