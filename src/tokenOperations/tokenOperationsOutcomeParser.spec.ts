import { assert } from "chai";
import { loadTestWallets, TestWallet } from "../testutils";
import { TokenOperationsOutcomeParser } from "./tokenOperationsOutcomeParser";

describe("test parsers", () => {
    let frank: TestWallet, grace: TestWallet;

    before(async function () {
        ({ frank, grace } = await loadTestWallets());
    });

    it("should parse outcome of issueFungible", () => {
        const parser = new TokenOperationsOutcomeParser();

        const outcome = parser.parseIssueFungible({
            hash: "hash",
            contractResults: { items: [] },
            logs: {
                events: [
                    {
                        address: frank.address,
                        identifier: "issue",
                        topics: [createTopic(Buffer.from("FOOBAR"))],
                        data: ""
                    }
                ]
            }
        });

        assert.equal(outcome.tokenIdentifier, "FOOBAR");
    });

    it("should ...", () => {

    });

    function createTopic(value: Buffer): any {
        return {
            valueOf: () => value
        };
    }
});
