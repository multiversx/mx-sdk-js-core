import { assert } from "chai";
import { Address } from "../address";
import { ErrParseTransactionOutcome } from "../errors";
import { ContractResultItem, ContractResults } from "../networkProviders";
import { TransactionEvent, TransactionEventData, TransactionEventTopic } from "../transactionEvents";
import { TransactionLogs } from "../transactionLogs";
import { TransactionOnNetwork } from "../transactions";
import { TokenManagementTransactionsOutcomeParser } from "./tokenManagementTransactionsOutcomeParser";

describe("test token management transactions outcome parser", () => {
    const parser = new TokenManagementTransactionsOutcomeParser();

    it("should test ensure error", () => {
        const encodedTopics = [
            new TransactionEventTopic("Avk0jZ1kR+l9c76wQQoYcu4hvXPz+jxxTdqQeaCrbX8="),
            new TransactionEventTopic("dGlja2VyIG5hbWUgaXMgbm90IHZhbGlk"),
        ];
        const event = new TransactionEvent({
            address: new Address("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u"),
            identifier: "signalError",
            topics: encodedTopics,
            dataPayload: new TransactionEventData(Buffer.from("QDc1NzM2NTcyMjA2NTcyNzI2Zjcy", "base64")),
        });

        const logs = new TransactionLogs({ events: [event] });
        const txOutcome = new TransactionOnNetwork({ logs: logs });

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

        const encodedTopics = [
            new TransactionEventTopic(base64Identifier),
            new TransactionEventTopic("U0VDT05E"),
            new TransactionEventTopic("Wlpa"),
            new TransactionEventTopic("RnVuZ2libGVFU0RU"),
            new TransactionEventTopic("Ag=="),
        ];
        const event = new TransactionEvent({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            identifier: "issue",
            topics: encodedTopics,
        });

        const logs = new TransactionLogs({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            events: [event],
        });

        const txOutcome = new TransactionOnNetwork({ logs: logs });

        const outcome = parser.parseIssueFungible(txOutcome);
        assert.lengthOf(outcome, 1);
        assert.equal(outcome[0].tokenIdentifier, identifier);
    });

    it("should test parse issue non fungible", () => {
        const identifier = "NFT-f01d1e";
        const base64Identifier = Buffer.from(identifier).toString("base64");

        let encodedTopics = [
            new TransactionEventTopic("TkZULWYwMWQxZQ=="),
            new TransactionEventTopic(""),
            new TransactionEventTopic("Y2FuVXBncmFkZQ=="),
            new TransactionEventTopic("dHJ1ZQ=="),
            new TransactionEventTopic("Y2FuQWRkU3BlY2lhbFJvbGVz"),
            new TransactionEventTopic("dHJ1ZQ=="),
        ];
        const firstEvent = new TransactionEvent({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            identifier: "upgradeProperties",
            topics: encodedTopics,
        });

        encodedTopics = [
            new TransactionEventTopic("TkZULWYwMWQxZQ=="),
            new TransactionEventTopic(""),
            new TransactionEventTopic(""),
            new TransactionEventTopic("RVNEVFJvbGVCdXJuRm9yQWxs"),
        ];
        const secondEvent = new TransactionEvent({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            identifier: "ESDTSetBurnRoleForAll",
            topics: encodedTopics,
        });

        encodedTopics = [
            new TransactionEventTopic(base64Identifier),
            new TransactionEventTopic("TkZURVNU"),
            new TransactionEventTopic("TkZU"),
            new TransactionEventTopic("Tm9uRnVuZ2libGVFU0RU"),
        ];
        const thirdEvent = new TransactionEvent({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            identifier: "issueNonFungible",
            topics: encodedTopics,
        });

        const logs = new TransactionLogs({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            events: [firstEvent, secondEvent, thirdEvent],
        });

        const txOutcome = new TransactionOnNetwork({ logs: logs });

        const outcome = parser.parseIssueNonFungible(txOutcome);
        assert.lengthOf(outcome, 1);
        assert.equal(outcome[0].tokenIdentifier, identifier);
    });

    it("should test parse issue semi fungible", () => {
        const identifier = "SEMIFNG-2c6d9f";
        const base64Identifier = Buffer.from(identifier).toString("base64");

        const encodedTopics = [
            new TransactionEventTopic(base64Identifier),
            new TransactionEventTopic("U0VNSQ=="),
            new TransactionEventTopic("U0VNSUZORw=="),
            new TransactionEventTopic("U2VtaUZ1bmdpYmxlRVNEVA=="),
        ];
        const event = new TransactionEvent({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            identifier: "issueSemiFungible",
            topics: encodedTopics,
        });

        const logs = new TransactionLogs({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            events: [event],
        });

        const txOutcome = new TransactionOnNetwork({ logs: logs });

        const outcome = parser.parseIssueSemiFungible(txOutcome);
        assert.lengthOf(outcome, 1);
        assert.equal(outcome[0].tokenIdentifier, identifier);
    });

    it("should test parse register meta esdt", () => {
        const identifier = "METATEST-e05d11";
        const base64Identifier = Buffer.from(identifier).toString("base64");

        const encodedTopics = [
            new TransactionEventTopic(base64Identifier),
            new TransactionEventTopic("TUVURVNU"),
            new TransactionEventTopic("TUVUQVRFU1Q="),
            new TransactionEventTopic("TWV0YUVTRFQ="),
        ];
        const event = new TransactionEvent({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            identifier: "registerMetaESDT",
            topics: encodedTopics,
        });

        const logs = new TransactionLogs({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            events: [event],
        });

        const txOutcome = new TransactionOnNetwork({ logs: logs });

        const outcome = parser.parseRegisterMetaEsdt(txOutcome);
        assert.lengthOf(outcome, 1);
        assert.equal(outcome[0].tokenIdentifier, identifier);
    });

    it("should test parse register and set all roles", () => {
        const firstIdentifier = "LMAO-d9f892";
        const firstBase64Identifier = Buffer.from(firstIdentifier).toString("base64");

        const secondIdentifier = "TST-123456";
        const secondBase64Identifier = Buffer.from(secondIdentifier).toString("base64");

        const roles = ["ESDTRoleLocalMint", "ESDTRoleLocalBurn"];

        let encodedTopics = [
            new TransactionEventTopic(firstBase64Identifier),
            new TransactionEventTopic("TE1BTw=="),
            new TransactionEventTopic("TE1BTw=="),
            new TransactionEventTopic("RnVuZ2libGVFU0RU"),
            new TransactionEventTopic("Ag=="),
        ];
        const firstEvent = new TransactionEvent({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            identifier: "registerAndSetAllRoles",
            topics: encodedTopics,
        });

        encodedTopics = [
            new TransactionEventTopic(secondBase64Identifier),
            new TransactionEventTopic("TE1BTw=="),
            new TransactionEventTopic("TE1BTw=="),
            new TransactionEventTopic("RnVuZ2libGVFU0RU"),
            new TransactionEventTopic("Ag=="),
        ];
        const secondEvent = new TransactionEvent({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            identifier: "registerAndSetAllRoles",
            topics: encodedTopics,
        });

        const transactionLogs = new TransactionLogs({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            events: [firstEvent, secondEvent],
        });

        encodedTopics = [
            new TransactionEventTopic("TE1BTy1kOWY4OTI="),
            new TransactionEventTopic(""),
            new TransactionEventTopic(""),
            new TransactionEventTopic("RVNEVFJvbGVMb2NhbE1pbnQ="),
            new TransactionEventTopic("RVNEVFJvbGVMb2NhbEJ1cm4="),
        ];
        const firstResultEvent = new TransactionEvent({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            identifier: "ESDTSetRole",
            topics: encodedTopics,
        });

        encodedTopics = [
            new TransactionEventTopic("VFNULTEyMzQ1Ng=="),
            new TransactionEventTopic(""),
            new TransactionEventTopic(""),
            new TransactionEventTopic("RVNEVFJvbGVMb2NhbE1pbnQ="),
            new TransactionEventTopic("RVNEVFJvbGVMb2NhbEJ1cm4="),
        ];
        const secondResultEvent = new TransactionEvent({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            identifier: "ESDTSetRole",
            topics: encodedTopics,
        });

        const resultLogs = new TransactionLogs({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            events: [firstResultEvent, secondResultEvent],
        });

        const scResult = new ContractResults([
            new ContractResultItem({
                sender: new Address("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u"),
                receiver: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
                data: "RVNEVFNldFJvbGVANGM0ZDQxNGYyZDY0Mzk2NjM4MzkzMkA0NTUzNDQ1NDUyNmY2YzY1NGM2ZjYzNjE2YzRkNjk2ZTc0QDQ1NTM0NDU0NTI2ZjZjNjU0YzZmNjM2MTZjNDI3NTcyNmU=",
                logs: resultLogs,
            }),
        ]);

        const txOutcome = new TransactionOnNetwork({
            contractResults: scResult,
            logs: transactionLogs,
        });

        const outcome = parser.parseRegisterAndSetAllRoles(txOutcome);
        assert.lengthOf(outcome, 2);

        assert.equal(outcome[0].tokenIdentifier, firstIdentifier);
        assert.deepEqual(outcome[0].roles, roles);

        assert.equal(outcome[1].tokenIdentifier, secondIdentifier);
        assert.deepEqual(outcome[1].roles, roles);
    });

    it("should test parse register set special role", () => {
        const identifier = "METATEST-e05d11";
        const base64Identifier = Buffer.from(identifier).toString("base64");
        const roles = ["ESDTRoleNFTCreate", "ESDTRoleNFTAddQuantity", "ESDTRoleNFTBurn"];

        const encodedTopics = [
            new TransactionEventTopic(base64Identifier),
            new TransactionEventTopic(""),
            new TransactionEventTopic(""),
            new TransactionEventTopic("RVNEVFJvbGVORlRDcmVhdGU="),
            new TransactionEventTopic("RVNEVFJvbGVORlRBZGRRdWFudGl0eQ=="),
            new TransactionEventTopic("RVNEVFJvbGVORlRCdXJu"),
        ];
        const event = new TransactionEvent({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            identifier: "ESDTSetRole",
            topics: encodedTopics,
        });

        const transactionLogs = new TransactionLogs({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            events: [event],
        });

        const txOutcome = new TransactionOnNetwork({
            logs: transactionLogs,
        });

        const outcome = parser.parseSetSpecialRole(txOutcome);
        assert.lengthOf(outcome, 1);
        assert.deepEqual(
            outcome[0].userAddress,
            new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
        );
        assert.equal(outcome[0].tokenIdentifier, identifier);
        assert.deepEqual(outcome[0].roles, roles);
    });

    it("should test parse nft create", () => {
        const identifier = "NFT-f01d1e";
        const base64Identifier = Buffer.from(identifier).toString("base64");
        const nonce = BigInt(1);
        const initialQuantity = BigInt(1);

        const encodedTopics = [
            new TransactionEventTopic(base64Identifier),
            new TransactionEventTopic("AQ=="),
            new TransactionEventTopic("AQ=="),
            new TransactionEventTopic(
                "CAESAgABIuUBCAESCE5GVEZJUlNUGiA8NdfqyxqZpKDMqlN+8MwK4Qn0H2wrQCID5jO/uwcfXCDEEyouUW1ZM3ZKQ3NVcWpNM3hxeGR3VWczemJoVFNMUWZoN0szbW5aWXhyaGNRRFl4RzJDaHR0cHM6Ly9pcGZzLmlvL2lwZnMvUW1ZM3ZKQ3NVcWpNM3hxeGR3VWczemJoVFNMUWZoN0szbW5aWXhyaGNRRFl4Rzo9dGFnczo7bWV0YWRhdGE6UW1SY1A5NGtYcjV6WmpSR3ZpN21KNnVuN0xweFVoWVZSNFI0UnBpY3h6Z1lrdA==",
            ),
        ];
        const event = new TransactionEvent({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            identifier: "ESDTNFTCreate",
            topics: encodedTopics,
        });

        const transactionLogs = new TransactionLogs({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            events: [event],
        });

        const txOutcome = new TransactionOnNetwork({
            logs: transactionLogs,
        });

        const outcome = parser.parseNftCreate(txOutcome);
        assert.lengthOf(outcome, 1);
        assert.equal(outcome[0].tokenIdentifier, identifier);
        assert.equal(outcome[0].nonce, nonce);
        assert.equal(outcome[0].initialQuantity, initialQuantity);
    });

    it("should test parse local mint", () => {
        const identifier = "AAA-29c4c9";
        const base64Identifier = Buffer.from(identifier).toString("base64");
        const nonce = BigInt(0);
        const mintedSupply = BigInt(100000);

        const encodedTopics = [
            new TransactionEventTopic(base64Identifier),
            new TransactionEventTopic(""),
            new TransactionEventTopic("AYag"),
        ];
        const event = new TransactionEvent({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            identifier: "ESDTLocalMint",
            topics: encodedTopics,
        });

        const transactionLogs = new TransactionLogs({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            events: [event],
        });

        const txOutcome = new TransactionOnNetwork({
            logs: transactionLogs,
        });

        const outcome = parser.parseLocalMint(txOutcome);
        assert.lengthOf(outcome, 1);
        assert.equal(outcome[0].userAddress, event.address);
        assert.equal(outcome[0].tokenIdentifier, identifier);
        assert.equal(outcome[0].nonce, nonce);
        assert.equal(outcome[0].mintedSupply, mintedSupply);
    });

    it("should test parse local burn", () => {
        const identifier = "AAA-29c4c9";
        const base64Identifier = Buffer.from(identifier).toString("base64");
        const nonce = BigInt(0);
        const burntSupply = BigInt(100000);

        const encodedTopics = [
            new TransactionEventTopic(base64Identifier),
            new TransactionEventTopic(""),
            new TransactionEventTopic("AYag"),
        ];
        const event = new TransactionEvent({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            identifier: "ESDTLocalBurn",
            topics: encodedTopics,
        });

        const transactionLogs = new TransactionLogs({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            events: [event],
        });

        const txOutcome = new TransactionOnNetwork({
            logs: transactionLogs,
        });

        const outcome = parser.parseLocalBurn(txOutcome);
        assert.lengthOf(outcome, 1);
        assert.equal(outcome[0].userAddress, event.address);
        assert.equal(outcome[0].tokenIdentifier, identifier);
        assert.equal(outcome[0].nonce, nonce);
        assert.equal(outcome[0].burntSupply, burntSupply);
    });

    it("should test parse pause", () => {
        const identifier = "AAA-29c4c9";
        const base64Identifier = Buffer.from(identifier).toString("base64");

        const encodedTopics = [new TransactionEventTopic(base64Identifier)];
        const event = new TransactionEvent({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            identifier: "ESDTPause",
            topics: encodedTopics,
        });

        const transactionLogs = new TransactionLogs({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            events: [event],
        });

        const txOutcome = new TransactionOnNetwork({
            logs: transactionLogs,
        });

        const outcome = parser.parsePause(txOutcome);
        assert.lengthOf(outcome, 1);
        assert.equal(outcome[0].tokenIdentifier, identifier);
    });

    it("should test parse unpause", () => {
        const identifier = "AAA-29c4c9";
        const base64Identifier = Buffer.from(identifier).toString("base64");

        const encodedTopics = [new TransactionEventTopic(base64Identifier)];
        const event = new TransactionEvent({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            identifier: "ESDTUnPause",
            topics: encodedTopics,
        });

        const transactionLogs = new TransactionLogs({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            events: [event],
        });

        const txOutcome = new TransactionOnNetwork({
            logs: transactionLogs,
        });

        const outcome = parser.parseUnpause(txOutcome);
        assert.lengthOf(outcome, 1);
        assert.equal(outcome[0].tokenIdentifier, identifier);
    });

    it("should test parse freeze", () => {
        const identifier = "AAA-29c4c9";
        const base64Identifier = Buffer.from(identifier).toString("base64");
        const nonce = BigInt(0);
        const balance = BigInt(10000000);
        const address = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";

        const encodedTopics = [
            new TransactionEventTopic(base64Identifier),
            new TransactionEventTopic(""),
            new TransactionEventTopic("mJaA"),
            new TransactionEventTopic("ATlHLv9ohncamC8wg9pdQh8kwpGB5jiIIo3IHKYNaeE="),
        ];
        const event = new TransactionEvent({
            address: new Address("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u"),
            identifier: "ESDTFreeze",
            topics: encodedTopics,
        });

        const transactionLogs = new TransactionLogs({
            address: new Address("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
            events: [event],
        });

        const scResult = new ContractResults([
            new ContractResultItem({
                sender: new Address("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u"),
                receiver: new Address("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
                data: "RVNEVEZyZWV6ZUA0MTQxNDEyZDMyMzk2MzM0NjMzOQ==",
                logs: transactionLogs,
            }),
        ]);

        const txOutcome = new TransactionOnNetwork({
            contractResults: scResult,
        });

        const outcome = parser.parseFreeze(txOutcome);
        assert.lengthOf(outcome, 1);
        assert.equal(outcome[0].userAddress, address);
        assert.equal(outcome[0].tokenIdentifier, identifier);
        assert.equal(outcome[0].nonce, nonce);
        assert.equal(outcome[0].balance, balance);
    });

    it("should test parse unfreeze", () => {
        const identifier = "AAA-29c4c9";
        const base64Identifier = Buffer.from(identifier).toString("base64");
        const nonce = BigInt(0);
        const balance = BigInt(10000000);
        const address = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";

        const encodedTopics = [
            new TransactionEventTopic(base64Identifier),
            new TransactionEventTopic(""),
            new TransactionEventTopic("mJaA"),
            new TransactionEventTopic("ATlHLv9ohncamC8wg9pdQh8kwpGB5jiIIo3IHKYNaeE="),
        ];
        const event = new TransactionEvent({
            address: new Address("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u"),
            identifier: "ESDTUnFreeze",
            topics: encodedTopics,
        });

        const transactionLogs = new TransactionLogs({
            address: new Address("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
            events: [event],
        });

        const scResult = new ContractResults([
            new ContractResultItem({
                sender: new Address("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u"),
                receiver: new Address("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
                data: "RVNEVEZyZWV6ZUA0MTQxNDEyZDMyMzk2MzM0NjMzOQ==",
                logs: transactionLogs,
            }),
        ]);

        const txOutcome = new TransactionOnNetwork({
            contractResults: scResult,
        });

        const outcome = parser.parseUnfreeze(txOutcome);
        assert.lengthOf(outcome, 1);
        assert.equal(outcome[0].userAddress, address);
        assert.equal(outcome[0].tokenIdentifier, identifier);
        assert.equal(outcome[0].nonce, nonce);
        assert.equal(outcome[0].balance, balance);
    });

    it("should test parse wipe", () => {
        const identifier = "AAA-29c4c9";
        const base64Identifier = Buffer.from(identifier).toString("base64");
        const nonce = BigInt(0);
        const balance = BigInt(10000000);
        const address = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";

        const encodedTopics = [
            new TransactionEventTopic(base64Identifier),
            new TransactionEventTopic(""),
            new TransactionEventTopic("mJaA"),
            new TransactionEventTopic("ATlHLv9ohncamC8wg9pdQh8kwpGB5jiIIo3IHKYNaeE="),
        ];
        const event = new TransactionEvent({
            address: new Address("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u"),
            identifier: "ESDTWipe",
            topics: encodedTopics,
        });

        const transactionLogs = new TransactionLogs({
            address: new Address("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
            events: [event],
        });

        const scResult = new ContractResults([
            new ContractResultItem({
                sender: new Address("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u"),
                receiver: new Address("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
                data: "RVNEVEZyZWV6ZUA0MTQxNDEyZDMyMzk2MzM0NjMzOQ==",
                logs: transactionLogs,
            }),
        ]);

        const txOutcome = new TransactionOnNetwork({
            contractResults: scResult,
        });

        const outcome = parser.parseWipe(txOutcome);
        assert.lengthOf(outcome, 1);
        assert.equal(outcome[0].userAddress, address);
        assert.equal(outcome[0].tokenIdentifier, identifier);
        assert.equal(outcome[0].nonce, nonce);
        assert.equal(outcome[0].balance, balance);
    });

    it("should test parse update attributes", () => {
        const identifier = "NFT-f01d1e";
        const base64Identifier = Buffer.from(identifier).toString("base64");
        const nonce = BigInt(1);
        const attributes = "metadata:ipfsCID/test.json;tags:tag1,tag2";
        const base64Attributes = Buffer.from(attributes).toString("base64");

        const encodedTopics = [
            new TransactionEventTopic(base64Identifier),
            new TransactionEventTopic("AQ=="),
            new TransactionEventTopic(""),
            new TransactionEventTopic(base64Attributes),
        ];
        const event = new TransactionEvent({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            identifier: "ESDTNFTUpdateAttributes",
            topics: encodedTopics,
        });

        const transactionLogs = new TransactionLogs({
            address: new Address("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
            events: [event],
        });

        const txOutcome = new TransactionOnNetwork({
            logs: transactionLogs,
        });

        const outcome = parser.parseUpdateAttributes(txOutcome);
        assert.lengthOf(outcome, 1);
        assert.equal(outcome[0].tokenIdentifier, identifier);
        assert.equal(outcome[0].nonce, nonce);
        assert.equal(Buffer.from(outcome[0].attributes).toString(), attributes);
    });

    it("should test parse add quantity", () => {
        const identifier = "NFT-f01d1e";
        const base64Identifier = Buffer.from(identifier).toString("base64");
        const nonce = BigInt(1);
        const addedQuantity = BigInt(10);

        const encodedTopics = [
            new TransactionEventTopic(base64Identifier),
            new TransactionEventTopic("AQ=="),
            new TransactionEventTopic("Cg=="),
        ];
        const event = new TransactionEvent({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            identifier: "ESDTNFTAddQuantity",
            topics: encodedTopics,
        });

        const transactionLogs = new TransactionLogs({
            address: new Address("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
            events: [event],
        });

        const txOutcome = new TransactionOnNetwork({
            logs: transactionLogs,
        });

        const outcome = parser.parseAddQuantity(txOutcome);
        assert.lengthOf(outcome, 1);
        assert.equal(outcome[0].tokenIdentifier, identifier);
        assert.equal(outcome[0].nonce, nonce);
        assert.equal(outcome[0].addedQuantity, addedQuantity);
    });

    it("should test parse burn quantity", () => {
        const identifier = "NFT-f01d1e";
        const base64Identifier = Buffer.from(identifier).toString("base64");
        const nonce = BigInt(1);
        const burntQuantity = BigInt(16);

        const encodedTopics = [
            new TransactionEventTopic(base64Identifier),
            new TransactionEventTopic("AQ=="),
            new TransactionEventTopic("EA=="),
        ];
        const event = new TransactionEvent({
            address: new Address("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
            identifier: "ESDTNFTBurn",
            topics: encodedTopics,
        });

        const transactionLogs = new TransactionLogs({
            address: new Address("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
            events: [event],
        });

        const txOutcome = new TransactionOnNetwork({
            logs: transactionLogs,
        });

        const outcome = parser.parseBurnQuantity(txOutcome);
        assert.lengthOf(outcome, 1);
        assert.equal(outcome[0].tokenIdentifier, identifier);
        assert.equal(outcome[0].nonce, nonce);
        assert.equal(outcome[0].burntQuantity, burntQuantity);
    });
});
