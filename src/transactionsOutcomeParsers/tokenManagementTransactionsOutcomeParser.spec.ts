import { assert } from "chai";
import { ErrParseTransactionOutcome } from "../errors";
import { TokenManagementTransactionsOutcomeParser } from "./tokenManagementTransactionsOutcomeParser";
import { SmartContractResult, TransactionEvent, TransactionLogs, TransactionOutcome } from "./resources";

describe("test token management transactions outcome parser", () => {
    const parser = new TokenManagementTransactionsOutcomeParser();

    it("should test ensure error", () => {
        const event = new TransactionEvent({
            address: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u",
            identifier: "signalError",
            topics: ["Avk0jZ1kR+l9c76wQQoYcu4hvXPz+jxxTdqQeaCrbX8=", "dGlja2VyIG5hbWUgaXMgbm90IHZhbGlk"],
            data: Buffer.from("QDc1NzM2NTcyMjA2NTcyNzI2Zjcy", "base64"),
        });

        const logs = new TransactionLogs({ events: [event] });
        const txOutcome = new TransactionOutcome({ transactionLogs: logs });

        assert.throws(
            () => {
                parser.parseIssueFungible(txOutcome);
            },
            ErrParseTransactionOutcome,
            "encountered signalError: ticker name is not valid (user error)",
        );
    });

    it("should test parse issue fungible", () => {
        const identifier = "ZZZ-9ee87d";
        const base64Identifier = Buffer.from(identifier).toString("base64");

        const event = new TransactionEvent({
            address: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            identifier: "issue",
            topics: [base64Identifier, "U0VDT05E", "Wlpa", "RnVuZ2libGVFU0RU", "Ag=="],
        });

        const logs = new TransactionLogs({
            address: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            events: [event],
        });

        const txOutcome = new TransactionOutcome({ transactionLogs: logs });

        const outcome = parser.parseIssueFungible(txOutcome);
        assert.equal(outcome.tokenIdentifier, identifier);
    });

    it("should test parse issue non fungible", () => {
        const identifier = "NFT-f01d1e";
        const base64Identifier = Buffer.from(identifier).toString("base64");

        const firstEvent = new TransactionEvent({
            address: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            identifier: "upgradeProperties",
            topics: ["TkZULWYwMWQxZQ==", "", "Y2FuVXBncmFkZQ==", "dHJ1ZQ==", "Y2FuQWRkU3BlY2lhbFJvbGVz", "dHJ1ZQ=="],
        });

        const secondEvent = new TransactionEvent({
            address: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            identifier: "ESDTSetBurnRoleForAll",
            topics: ["TkZULWYwMWQxZQ==", "", "", "RVNEVFJvbGVCdXJuRm9yQWxs"],
        });

        const thirdEvent = new TransactionEvent({
            address: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            identifier: "issueNonFungible",
            topics: [base64Identifier, "TkZURVNU", "TkZU", "Tm9uRnVuZ2libGVFU0RU"],
        });

        const logs = new TransactionLogs({
            address: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            events: [firstEvent, secondEvent, thirdEvent],
        });

        const txOutcome = new TransactionOutcome({ transactionLogs: logs });

        const outcome = parser.parseIssueNonFungible(txOutcome);
        assert.equal(outcome.tokenIdentifier, identifier);
    });

    it("should test parse issue semi fungible", () => {
        const identifier = "SEMIFNG-2c6d9f";
        const base64Identifier = Buffer.from(identifier).toString("base64");

        const event = new TransactionEvent({
            address: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            identifier: "issueSemiFungible",
            topics: [base64Identifier, "U0VNSQ==", "U0VNSUZORw==", "U2VtaUZ1bmdpYmxlRVNEVA=="],
        });

        const logs = new TransactionLogs({
            address: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            events: [event],
        });

        const txOutcome = new TransactionOutcome({ transactionLogs: logs });

        const outcome = parser.parseIssueSemiFungible(txOutcome);
        assert.equal(outcome.tokenIdentifier, identifier);
    });

    it("should test parse register meta esdt", () => {
        const identifier = "METATEST-e05d11";
        const base64Identifier = Buffer.from(identifier).toString("base64");

        const event = new TransactionEvent({
            address: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            identifier: "registerMetaESDT",
            topics: [base64Identifier, "TUVURVNU", "TUVUQVRFU1Q=", "TWV0YUVTRFQ="],
        });

        const logs = new TransactionLogs({
            address: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            events: [event],
        });

        const txOutcome = new TransactionOutcome({ transactionLogs: logs });

        const outcome = parser.parseRegisterMetaEsdt(txOutcome);
        assert.equal(outcome.tokenIdentifier, identifier);
    });

    it("should test parse register and set all roles", () => {
        const identifier = "LMAO-d9f892";
        const base64Identifier = Buffer.from(identifier).toString("base64");
        const roles = ["ESDTRoleLocalMint", "ESDTRoleLocalBurn"];

        const event = new TransactionEvent({
            address: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            identifier: "registerAndSetAllRoles",
            topics: [base64Identifier, "TE1BTw==", "TE1BTw==", "RnVuZ2libGVFU0RU", "Ag=="],
        });

        const transactionLogs = new TransactionLogs({
            address: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            events: [event],
        });

        const resultEvent = new TransactionEvent({
            address: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            identifier: "ESDTSetRole",
            topics: ["TE1BTy1kOWY4OTI=", "", "", "RVNEVFJvbGVMb2NhbE1pbnQ=", "RVNEVFJvbGVMb2NhbEJ1cm4="],
        });

        const resultLogs = new TransactionLogs({
            address: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            events: [resultEvent],
        });

        const scResult = new SmartContractResult({
            sender: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u",
            receiver: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            data: Buffer.from(
                "RVNEVFNldFJvbGVANGM0ZDQxNGYyZDY0Mzk2NjM4MzkzMkA0NTUzNDQ1NDUyNmY2YzY1NGM2ZjYzNjE2YzRkNjk2ZTc0QDQ1NTM0NDU0NTI2ZjZjNjU0YzZmNjM2MTZjNDI3NTcyNmU=",
                "base64",
            ),
            logs: resultLogs,
        });

        const txOutcome = new TransactionOutcome({
            smartContractResults: [scResult],
            transactionLogs: transactionLogs,
        });

        const outcome = parser.parseRegisterAndSetAllRoles(txOutcome);
        assert.equal(outcome.tokenIdentifier, identifier);
        assert.deepEqual(outcome.roles, roles);
    });

    it("should test parse register set special role", () => {
        const identifier = "METATEST-e05d11";
        const base64Identifier = Buffer.from(identifier).toString("base64");
        const roles = ["ESDTRoleNFTCreate", "ESDTRoleNFTAddQuantity", "ESDTRoleNFTBurn"];

        const event = new TransactionEvent({
            address: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            identifier: "ESDTSetRole",
            topics: [
                base64Identifier,
                "",
                "",
                "RVNEVFJvbGVORlRDcmVhdGU=",
                "RVNEVFJvbGVORlRBZGRRdWFudGl0eQ==",
                "RVNEVFJvbGVORlRCdXJu",
            ],
        });

        const transactionLogs = new TransactionLogs({
            address: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            events: [event],
        });

        const txOutcome = new TransactionOutcome({
            transactionLogs: transactionLogs,
        });

        const outcome = parser.parseSetSpecialRole(txOutcome);
        assert.equal(outcome.userAddress, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(outcome.tokenIdentifier, identifier);
        assert.deepEqual(outcome.roles, roles);
    });

    it("should test parse nft create", () => {
        const identifier = "NFT-f01d1e";
        const base64Identifier = Buffer.from(identifier).toString("base64");
        const nonce = BigInt(1);
        const initialQuantity = BigInt(1);

        const event = new TransactionEvent({
            address: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            identifier: "ESDTNFTCreate",
            topics: [
                base64Identifier,
                "AQ==",
                "AQ==",
                "CAESAgABIuUBCAESCE5GVEZJUlNUGiA8NdfqyxqZpKDMqlN+8MwK4Qn0H2wrQCID5jO/uwcfXCDEEyouUW1ZM3ZKQ3NVcWpNM3hxeGR3VWczemJoVFNMUWZoN0szbW5aWXhyaGNRRFl4RzJDaHR0cHM6Ly9pcGZzLmlvL2lwZnMvUW1ZM3ZKQ3NVcWpNM3hxeGR3VWczemJoVFNMUWZoN0szbW5aWXhyaGNRRFl4Rzo9dGFnczo7bWV0YWRhdGE6UW1SY1A5NGtYcjV6WmpSR3ZpN21KNnVuN0xweFVoWVZSNFI0UnBpY3h6Z1lrdA==",
            ],
        });

        const transactionLogs = new TransactionLogs({
            address: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            events: [event],
        });

        const txOutcome = new TransactionOutcome({
            transactionLogs: transactionLogs,
        });

        const outcome = parser.parseNftCreate(txOutcome);
        assert.equal(outcome.tokenIdentifier, identifier);
        assert.equal(outcome.nonce, nonce);
        assert.equal(outcome.initialQuantity, initialQuantity);
    });

    it("should test parse local mint", () => {
        const identifier = "AAA-29c4c9";
        const base64Identifier = Buffer.from(identifier).toString("base64");
        const nonce = BigInt(0);
        const mintedSupply = BigInt(100000);

        const event = new TransactionEvent({
            address: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            identifier: "ESDTLocalMint",
            topics: [base64Identifier, "", "AYag"],
        });

        const transactionLogs = new TransactionLogs({
            address: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            events: [event],
        });

        const txOutcome = new TransactionOutcome({
            transactionLogs: transactionLogs,
        });

        const outcome = parser.parseLocalMint(txOutcome);
        assert.equal(outcome.userAddress, event.address);
        assert.equal(outcome.tokenIdentifier, identifier);
        assert.equal(outcome.nonce, nonce);
        assert.equal(outcome.mintedSupply, mintedSupply);
    });

    it("should test parse local burn", () => {
        const identifier = "AAA-29c4c9";
        const base64Identifier = Buffer.from(identifier).toString("base64");
        const nonce = BigInt(0);
        const burntSupply = BigInt(100000);

        const event = new TransactionEvent({
            address: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            identifier: "ESDTLocalBurn",
            topics: [base64Identifier, "", "AYag"],
        });

        const transactionLogs = new TransactionLogs({
            address: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            events: [event],
        });

        const txOutcome = new TransactionOutcome({
            transactionLogs: transactionLogs,
        });

        const outcome = parser.parseLocalBurn(txOutcome);
        assert.equal(outcome.userAddress, event.address);
        assert.equal(outcome.tokenIdentifier, identifier);
        assert.equal(outcome.nonce, nonce);
        assert.equal(outcome.burntSupply, burntSupply);
    });

    it("should test parse pause", () => {
        const identifier = "AAA-29c4c9";
        const base64Identifier = Buffer.from(identifier).toString("base64");

        const event = new TransactionEvent({
            address: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            identifier: "ESDTPause",
            topics: [base64Identifier],
        });

        const transactionLogs = new TransactionLogs({
            address: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            events: [event],
        });

        const txOutcome = new TransactionOutcome({
            transactionLogs: transactionLogs,
        });

        const outcome = parser.parsePause(txOutcome);
        assert.equal(outcome.tokenIdentifier, identifier);
    });

    it("should test parse unpause", () => {
        const identifier = "AAA-29c4c9";
        const base64Identifier = Buffer.from(identifier).toString("base64");

        const event = new TransactionEvent({
            address: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            identifier: "ESDTUnPause",
            topics: [base64Identifier],
        });

        const transactionLogs = new TransactionLogs({
            address: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            events: [event],
        });

        const txOutcome = new TransactionOutcome({
            transactionLogs: transactionLogs,
        });

        const outcome = parser.parseUnpause(txOutcome);
        assert.equal(outcome.tokenIdentifier, identifier);
    });

    it("should test parse freeze", () => {
        const identifier = "AAA-29c4c9";
        const base64Identifier = Buffer.from(identifier).toString("base64");
        const nonce = BigInt(0);
        const balance = BigInt(10000000);
        const address = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";

        const event = new TransactionEvent({
            address: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u",
            identifier: "ESDTFreeze",
            topics: [base64Identifier, "", "mJaA", "ATlHLv9ohncamC8wg9pdQh8kwpGB5jiIIo3IHKYNaeE="],
        });

        const transactionLogs = new TransactionLogs({
            address: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
            events: [event],
        });

        const scResult = new SmartContractResult({
            sender: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u",
            receiver: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
            data: Buffer.from("RVNEVEZyZWV6ZUA0MTQxNDEyZDMyMzk2MzM0NjMzOQ==", "base64"),
            logs: transactionLogs,
        });

        const txOutcome = new TransactionOutcome({
            smartContractResults: [scResult],
        });

        const outcome = parser.parseFreeze(txOutcome);
        assert.equal(outcome.userAddress, address);
        assert.equal(outcome.tokenIdentifier, identifier);
        assert.equal(outcome.nonce, nonce);
        assert.equal(outcome.balance, balance);
    });

    it("should test parse unfreeze", () => {
        const identifier = "AAA-29c4c9";
        const base64Identifier = Buffer.from(identifier).toString("base64");
        const nonce = BigInt(0);
        const balance = BigInt(10000000);
        const address = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";

        const event = new TransactionEvent({
            address: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u",
            identifier: "ESDTUnFreeze",
            topics: [base64Identifier, "", "mJaA", "ATlHLv9ohncamC8wg9pdQh8kwpGB5jiIIo3IHKYNaeE="],
        });

        const transactionLogs = new TransactionLogs({
            address: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
            events: [event],
        });

        const scResult = new SmartContractResult({
            sender: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u",
            receiver: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
            data: Buffer.from("RVNEVEZyZWV6ZUA0MTQxNDEyZDMyMzk2MzM0NjMzOQ==", "base64"),
            logs: transactionLogs,
        });

        const txOutcome = new TransactionOutcome({
            smartContractResults: [scResult],
        });

        const outcome = parser.parseUnfreeze(txOutcome);
        assert.equal(outcome.userAddress, address);
        assert.equal(outcome.tokenIdentifier, identifier);
        assert.equal(outcome.nonce, nonce);
        assert.equal(outcome.balance, balance);
    });

    it("should test parse wipe", () => {
        const identifier = "AAA-29c4c9";
        const base64Identifier = Buffer.from(identifier).toString("base64");
        const nonce = BigInt(0);
        const balance = BigInt(10000000);
        const address = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";

        const event = new TransactionEvent({
            address: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u",
            identifier: "ESDTWipe",
            topics: [base64Identifier, "", "mJaA", "ATlHLv9ohncamC8wg9pdQh8kwpGB5jiIIo3IHKYNaeE="],
        });

        const transactionLogs = new TransactionLogs({
            address: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
            events: [event],
        });

        const scResult = new SmartContractResult({
            sender: "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u",
            receiver: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
            data: Buffer.from("RVNEVEZyZWV6ZUA0MTQxNDEyZDMyMzk2MzM0NjMzOQ==", "base64"),
            logs: transactionLogs,
        });

        const txOutcome = new TransactionOutcome({
            smartContractResults: [scResult],
        });

        const outcome = parser.parseWipe(txOutcome);
        assert.equal(outcome.userAddress, address);
        assert.equal(outcome.tokenIdentifier, identifier);
        assert.equal(outcome.nonce, nonce);
        assert.equal(outcome.balance, balance);
    });

    it("should test parse update attributes", () => {
        const identifier = "NFT-f01d1e";
        const base64Identifier = Buffer.from(identifier).toString("base64");
        const nonce = BigInt(1);
        const attributes = "metadata:ipfsCID/test.json;tags:tag1,tag2";
        const base64Attributes = Buffer.from(attributes).toString("base64");

        const event = new TransactionEvent({
            address: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            identifier: "ESDTNFTUpdateAttributes",
            topics: [base64Identifier, "AQ==", "", base64Attributes],
        });

        const transactionLogs = new TransactionLogs({
            address: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
            events: [event],
        });

        const txOutcome = new TransactionOutcome({
            transactionLogs: transactionLogs,
        });

        const outcome = parser.parseUpdateAttributes(txOutcome);
        assert.equal(outcome.tokenIdentifier, identifier);
        assert.equal(outcome.nonce, nonce);
        assert.equal(Buffer.from(outcome.attributes).toString(), attributes);
    });

    it("should test parse add quantity", () => {
        const identifier = "NFT-f01d1e";
        const base64Identifier = Buffer.from(identifier).toString("base64");
        const nonce = BigInt(1);
        const addedQuantity = BigInt(10);

        const event = new TransactionEvent({
            address: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            identifier: "ESDTNFTAddQuantity",
            topics: [base64Identifier, "AQ==", "Cg=="],
        });

        const transactionLogs = new TransactionLogs({
            address: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
            events: [event],
        });

        const txOutcome = new TransactionOutcome({
            transactionLogs: transactionLogs,
        });

        const outcome = parser.parseAddQuantity(txOutcome);
        assert.equal(outcome.tokenIdentifier, identifier);
        assert.equal(outcome.nonce, nonce);
        assert.equal(outcome.addedQuantity, addedQuantity);
    });

    it("should test parse burn quantity", () => {
        const identifier = "NFT-f01d1e";
        const base64Identifier = Buffer.from(identifier).toString("base64");
        const nonce = BigInt(1);
        const burntQuantity = BigInt(16);

        const event = new TransactionEvent({
            address: "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2",
            identifier: "ESDTNFTBurn",
            topics: [base64Identifier, "AQ==", "EA=="],
        });

        const transactionLogs = new TransactionLogs({
            address: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
            events: [event],
        });

        const txOutcome = new TransactionOutcome({
            transactionLogs: transactionLogs,
        });

        const outcome = parser.parseBurnQuantity(txOutcome);
        assert.equal(outcome.tokenIdentifier, identifier);
        assert.equal(outcome.nonce, nonce);
        assert.equal(outcome.burntQuantity, burntQuantity);
    });
});
