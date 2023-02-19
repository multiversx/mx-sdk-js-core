import { assert } from "chai";
import { loadTestWallets, TestWallet } from "../testutils";
import { bigIntToBuffer } from "./codec";
import { TokenOperationsOutcomeParser } from "./tokenOperationsOutcomeParser";

describe("test parsers", () => {
    const parser = new TokenOperationsOutcomeParser();
    let frank: TestWallet, grace: TestWallet;

    before(async function () {
        ({ frank, grace } = await loadTestWallets());
    });

    it("should parse outcome of issueFungible", () => {
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

    it("should parse outcome of setSpecialRole", () => {
        const outcome = parser.parseSetSpecialRole({
            hash: "hash",
            contractResults: { items: [] },
            logs: {
                events: [
                    {
                        address: grace.address,
                        identifier: "ESDTSetRole",
                        topics: [
                            createTopic(Buffer.from("FOOBAR")),
                            createTopic(Buffer.from("")),
                            createTopic(Buffer.from("")),
                            createTopic(Buffer.from("ESDTRoleLocalMint")),
                            createTopic(Buffer.from("ESDTRoleLocalBurn"))
                        ],
                        data: ""
                    }
                ]
            }
        });

        assert.equal(outcome.tokenIdentifier, "FOOBAR");
        assert.deepEqual(outcome.roles, ["ESDTRoleLocalMint", "ESDTRoleLocalBurn"]);
        assert.equal(outcome.userAddress, grace.address.toString());
    });

    it("should parse outcome of localMint", () => {
        const outcome = parser.parseLocalMint({
            hash: "hash",
            contractResults: { items: [] },
            logs: {
                events: [
                    {
                        address: grace.address,
                        identifier: "ESDTLocalMint",
                        topics: [
                            createTopic(Buffer.from("FOOBAR")),
                            createTopic(Buffer.from("")),
                            createTopic(bigIntToBuffer("200")),
                        ],
                        data: ""
                    }
                ]
            }
        });

        assert.equal(outcome.tokenIdentifier, "FOOBAR");
        assert.equal(outcome.nonce, "0");
        assert.equal(outcome.mintedSupply, "200");
        assert.equal(outcome.userAddress, grace.address.toString());
    });

    it("should parse outcome of nftCreate", () => {
        const outcome = parser.parseNFTCreate({
            hash: "hash",
            contractResults: { items: [] },
            logs: {
                events: [
                    {
                        address: grace.address,
                        identifier: "ESDTNFTCreate",
                        topics: [
                            createTopic(Buffer.from("FOOBAR")),
                            createTopic(bigIntToBuffer("42")),
                            createTopic(bigIntToBuffer("1")),
                        ],
                        data: ""
                    }
                ]
            }
        });

        assert.equal(outcome.tokenIdentifier, "FOOBAR");
        assert.equal(outcome.nonce, "42");
        assert.equal(outcome.initialQuantity, "1");
    });

    function createTopic(value: Buffer): any {
        return {
            valueOf: () => value
        };
    }
});
