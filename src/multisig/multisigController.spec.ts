import { assert } from "chai";
import { Address, CodeMetadata, SmartContractQueryResponse } from "../core";
import { MockNetworkProvider } from "../testutils";
import { MultisigController } from "./multisigController";
import * as resources from "./resources";

describe("test multisig controller query methods", () => {
    const mockMultisigAddress: string = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqylllslmq6y6";
    const mockBoardMemberAddress = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";
    const mockProposerAddress = "erd1k2s324ww2g0yj38qn2ch2jwctdy8mnfxep94q9arncc6xecg3xaq6mjse8";
    let networkProvider = new MockNetworkProvider();
    let controller = new MultisigController({
        chainID: "D",
        networkProvider: networkProvider,
    });

    beforeEach(function () {
        networkProvider = new MockNetworkProvider();
        controller = new MultisigController({
            chainID: "D",
            networkProvider: networkProvider,
        });
    });

    it("getQuorum returns the quorum value", async function () {
        networkProvider.mockQueryContractOnFunction(
            "getQuorum",
            new SmartContractQueryResponse({
                function: "getQuorum",
                returnDataParts: [Buffer.from("03", "hex")],
                returnCode: "ok",
                returnMessage: "ok",
            }),
        );

        const result = await controller.getQuorum({ mutisigAddress: mockMultisigAddress });

        assert.equal(result, 3);
    });

    it("getNumBoardMembers returns the number of board members", async function () {
        networkProvider.mockQueryContractOnFunction(
            "getNumBoardMembers",
            new SmartContractQueryResponse({
                function: "getNumBoardMembers",
                returnDataParts: [Buffer.from("02", "hex")],
                returnCode: "ok",
                returnMessage: "ok",
            }),
        );
        const result = await controller.getNumBoardMembers({ mutisigAddress: mockMultisigAddress });

        assert.equal(result, 2);
    });

    it("queries and returns the number of groups", async function () {
        networkProvider.mockQueryContractOnFunction(
            "getNumGroups",
            new SmartContractQueryResponse({
                function: "getNumGroups",
                returnDataParts: [Buffer.from("05", "hex")],
                returnCode: "ok",
                returnMessage: "ok",
            }),
        );

        const result = await controller.getNumGroups({ mutisigAddress: mockMultisigAddress });

        assert.equal(result, 5);
    });

    it("getNumProposers returns the number of proposers", async function () {
        networkProvider.mockQueryContractOnFunction(
            "getNumProposers",
            new SmartContractQueryResponse({
                function: "getNumProposers",
                returnDataParts: [Buffer.from("04", "hex")],
                returnCode: "ok",
                returnMessage: "ok",
            }),
        );

        const result = await controller.getNumProposers({ mutisigAddress: mockMultisigAddress });

        assert.equal(result, 4);
    });

    it("getActionGroup returns the action group ID", async function () {
        networkProvider.mockQueryContractOnFunction(
            "getActionGroup",
            new SmartContractQueryResponse({
                function: "getActionGroup",
                returnDataParts: [Buffer.from("02", "hex")],
                returnCode: "ok",
                returnMessage: "ok",
            }),
        );

        const result = await controller.getActionGroup({
            mutisigAddress: mockMultisigAddress,
            groupId: 5,
        });
        assert.equal(result.length, 1);
        assert.equal(result[0], 2);
    });

    it("getLastGroupActionId returns the last group action ID", async function () {
        networkProvider.mockQueryContractOnFunction(
            "getLastGroupActionId",
            new SmartContractQueryResponse({
                function: "getLastGroupActionId",
                returnDataParts: [Buffer.from("07", "hex")],
                returnCode: "ok",
                returnMessage: "ok",
            }),
        );

        const result = await controller.getLastGroupActionId({
            mutisigAddress: mockMultisigAddress,
        });

        assert.equal(result, 7);
    });

    it("getActionLastIndex returns the last action ID", async function () {
        networkProvider.mockQueryContractOnFunction(
            "getActionLastIndex",
            new SmartContractQueryResponse({
                function: "getActionLastIndex",
                returnDataParts: [Buffer.from("42", "hex")],
                returnCode: "ok",
                returnMessage: "ok",
            }),
        );

        const result = await controller.getActionLastIndex({
            mutisigAddress: mockMultisigAddress,
        });

        assert.equal(result, 0x42);
    });

    it("hasSignedAction returns whether user has signed action", async function () {
        networkProvider.mockQueryContractOnFunction(
            "signed",
            new SmartContractQueryResponse({
                function: "signed",
                returnDataParts: [Buffer.from("01", "hex")], // 1 = true
                returnCode: "ok",
                returnMessage: "ok",
            }),
        );

        const result = await controller.hasSignedAction({
            mutisigAddress: mockMultisigAddress,
            userAddress: mockBoardMemberAddress,
            actionId: 42,
        });

        assert.isTrue(result);

        it("returns false when user has not signed", async function () {
            networkProvider.mockQueryContractOnFunction(
                "signed",
                new SmartContractQueryResponse({
                    function: "signed",
                    returnDataParts: [Buffer.from("00", "hex")], // 0 = false
                    returnCode: "ok",
                    returnMessage: "ok",
                }),
            );

            const result = await controller.hasSignedAction({
                mutisigAddress: mockMultisigAddress,
                userAddress: mockProposerAddress,
                actionId: 42,
            });

            assert.isFalse(result);
        });
    });

    it("quorumReached returns false when quorum reached", async function () {
        networkProvider.mockQueryContractOnFunction(
            "quorumReached",
            new SmartContractQueryResponse({
                function: "quorumReached",
                returnDataParts: [Buffer.from("01", "hex")], // 1 = true
                returnCode: "ok",
                returnMessage: "ok",
            }),
        );

        const result = await controller.quorumReached({
            mutisigAddress: mockMultisigAddress,
            actionId: 42,
        });

        assert.isTrue(result);

        it("quorumReached returns false when quorum not reached", async function () {
            networkProvider.mockQueryContractOnFunction(
                "quorumReached",
                new SmartContractQueryResponse({
                    function: "quorumReached",
                    returnDataParts: [Buffer.from("00", "hex")], // 0 = false
                    returnCode: "ok",
                    returnMessage: "ok",
                }),
            );

            const result = await controller.quorumReached({
                mutisigAddress: mockMultisigAddress,
                actionId: 42,
            });

            assert.isFalse(result);
        });
    });

    it("getUserRole returns the user role", async function () {
        networkProvider.mockQueryContractOnFunction(
            "userRole",
            new SmartContractQueryResponse({
                function: "userRole",
                returnDataParts: [Buffer.from("01", "hex")], // 1 = BOARD_MEMBER, for example
                returnCode: "ok",
                returnMessage: "ok",
            }),
        );

        const result = await controller.getUserRole({
            mutisigAddress: mockMultisigAddress,
            userAddress: mockBoardMemberAddress,
        });

        assert.equal(result, "Proposer"); // 1 could be board member role
    });

    it("getAllBoardMembers returns all board members as address array", async function () {
        // Prepare addresses for the mock response
        const address1 = Buffer.from(Address.newFromBech32(mockBoardMemberAddress).toHex(), "hex");
        const address2 = Buffer.from(Address.newFromBech32(mockProposerAddress).toHex(), "hex");
        networkProvider.mockQueryContractOnFunction(
            "getAllBoardMembers",
            new SmartContractQueryResponse({
                function: "getAllBoardMembers",
                returnDataParts: [address1, address2],
                returnCode: "ok",
                returnMessage: "ok",
            }),
        );

        const result = await controller.getAllBoardMembers({
            mutisigAddress: mockMultisigAddress,
        });

        assert.equal(result.length, 2);
        assert.equal(result[0], mockBoardMemberAddress);
        assert.equal(result[1], mockProposerAddress);
    });

    it("getAllProposers returns all proposers as address array", async function () {
        const address1 = Buffer.from(Address.newFromBech32(mockBoardMemberAddress).toHex(), "hex");
        const address2 = Buffer.from(Address.newFromBech32(mockProposerAddress).toHex(), "hex");

        networkProvider.mockQueryContractOnFunction(
            "getAllProposers",
            new SmartContractQueryResponse({
                function: "getAllProposers",
                returnDataParts: [address1, address2],
                returnCode: "ok",
                returnMessage: "ok",
            }),
        );

        const result = await controller.getAllProposers({
            mutisigAddress: mockMultisigAddress,
        });

        assert.equal(result.length, 2);
        assert.equal(result[0], mockBoardMemberAddress);
        assert.equal(result[1], mockProposerAddress);
    });

    it("getActionData returns the action data as SendTransferExecuteEgld", async function () {
        networkProvider.mockQueryContractOnFunction(
            "getActionData",
            new SmartContractQueryResponse({
                function: "getActionData",
                returnDataParts: [
                    Buffer.from(
                        "0500000000000000000500d006f73c4221216fa679bc559005584c4f1160e569e1000000012a0000000003616464000000010000000107",
                        "hex",
                    ),
                ],
                returnCode: "ok",
                returnMessage: "ok",
            }),
        );

        const result = await controller.getActionData({
            mutisigAddress: mockMultisigAddress,
            actionId: 42,
        });

        const mappedRes = result as resources.SendTransferExecuteEgld;
        assert.equal(mappedRes.receiver.toBech32(), "erd1qqqqqqqqqqqqqpgq6qr0w0zzyysklfneh32eqp2cf383zc89d8sstnkl60");
        assert.equal(mappedRes.funcionName, "add");
        assert.equal(mappedRes.amount, 42n);
    });

    it("getActionData returns the action data as SendAsyncCall", async function () {
        networkProvider.mockQueryContractOnFunction(
            "getActionData",
            new SmartContractQueryResponse({
                function: "getActionData",
                returnDataParts: [
                    Buffer.from(
                        "BwAAAAAAAAAABQB40pYyrLFZmAA/YV0KUSYTU9gEHT4TAAAACA3gtrOnZAAAAQAAAAADk4cAAAAAAQoAAAACAAAAAQ0AAAABDQ==",
                        "base64",
                    ),
                ],
                returnCode: "ok",
                returnMessage: "ok",
            }),
        );

        const result = await controller.getActionData({
            mutisigAddress: mockMultisigAddress,
            actionId: 42,
        });

        const mappedRes = result as resources.SendAsyncCall;
        assert.equal(mappedRes.receiver.toBech32(), "erd1qqqqqqqqqqqqqpgq0rffvv4vk9vesqplv9ws55fxzdfaspqa8cfszy2hms");
        assert.equal(mappedRes.funcionName, "add");
        assert.equal(mappedRes.amount, 0n);
    });

    it("getActionData returns the action data as SendTransferExecuteEsdt", async function () {
        networkProvider.mockQueryContractOnFunction(
            "getActionData",
            new SmartContractQueryResponse({
                function: "getActionData",
                returnDataParts: [
                    Buffer.from(
                        "BgAAAAAAAAAABQBJv/ljvfo+oCcTNiCV3zLj1wjqzPxXAAAAAQAAAAxBTElDRS01NjI3ZjEAAAAAAAAAAAAAAAEKAQAAAAAATEtAAAAAFDY0Njk3Mzc0NzI2OTYyNzU3NDY1AAAAAA==",
                        "base64",
                    ),
                ],
                returnCode: "ok",
                returnMessage: "ok",
            }),
        );

        const result = await controller.getActionData({
            mutisigAddress: mockMultisigAddress,
            actionId: 42,
        });

        const mappedRes = result as resources.SendTransferExecuteEsdt;

        assert.equal(mappedRes.receiver.toBech32(), "erd1qqqqqqqqqqqqqpgqfxlljcaalgl2qfcnxcsftheju0ts36kvl3ts3qkewe");
        assert.equal(mappedRes.funcionName, "distribute");
    });

    it("getActionData returns the action data as AddBoardMember", async function () {
        networkProvider.mockQueryContractOnFunction(
            "getActionData",
            new SmartContractQueryResponse({
                function: "getActionData",
                returnDataParts: [Buffer.from("AYBJ1jnlppgNHNI5KrzOQQKc2nShVjUjogLwlkHMJhj4", "base64")],
                returnCode: "ok",
                returnMessage: "ok",
            }),
        );

        const result = await controller.getActionData({
            mutisigAddress: mockMultisigAddress,
            actionId: 42,
        });

        const mappedRes = result as resources.AddBoardMember;

        assert.equal(mappedRes.address.toBech32(), "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");
    });

    it("getActionData returns the action data as AddProposer", async function () {
        networkProvider.mockQueryContractOnFunction(
            "getActionData",
            new SmartContractQueryResponse({
                function: "getActionData",
                returnDataParts: [Buffer.from("AYBJ1jnlppgNHNI5KrzOQQKc2nShVjUjogLwlkHMJhj4", "base64")],
                returnCode: "ok",
                returnMessage: "ok",
            }),
        );

        const result = await controller.getActionData({
            mutisigAddress: mockMultisigAddress,
            actionId: 42,
        });

        const mappedRes = result as resources.AddProposer;

        assert.equal(mappedRes.address.toBech32(), "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");
    });

    it("getActionData returns the action data as SCDeployFromSource", async function () {
        networkProvider.mockQueryContractOnFunction(
            "getActionData",
            new SmartContractQueryResponse({
                function: "getActionData",
                returnDataParts: [
                    Buffer.from(
                        "CAAAAAexorwuxQAAAAAAAAAAAAAFAIcNBBLO3ocYU6HC1Ip1Q8Bz6zn5aeEFAAAAAAEAAAABBw==",
                        "base64",
                    ),
                ],
                returnCode: "ok",
                returnMessage: "ok",
            }),
        );

        const result = await controller.getActionData({
            mutisigAddress: mockMultisigAddress,
            actionId: 42,
        });

        const mappedRes = result as resources.SCDeployFromSource;

        assert.equal(
            mappedRes.sourceContractAddress.toBech32(),
            "erd1qqqqqqqqqqqqqpgqsuxsgykwm6r3s5apct2g5a2rcpe7kw0ed8ssf6h9f6",
        );
        assert.equal(mappedRes.amount.toString(), "50000000000000000");
        assert.deepEqual(mappedRes.codeMetadata, new CodeMetadata(true, true, false));
    });

    it("getActionData returns the action data as SCUpgradeFromSource", async function () {
        networkProvider.mockQueryContractOnFunction(
            "getActionData",
            new SmartContractQueryResponse({
                function: "getActionData",
                returnDataParts: [
                    Buffer.from(
                        "CQAAAAAAAAAABQB+Jc5t66x0jYa105MSCrHrAqRtWBZ5AAAAB7GivC7FAAAAAAAAAAAAAAUAar0cOjeU2gFgK4VawD54IeZjjsgWeQUAAAAAAA==",
                        "base64",
                    ),
                ],
                returnCode: "ok",
                returnMessage: "ok",
            }),
        );
        const amount = BigInt(50000000000000000); // 0.05 EGLD
        const metadata = new CodeMetadata(true, true, false);
        const sourceContract = Address.newFromBech32("erd1qqqqqqqqqqqqqpgqd273cw3hjndqzcpts4dvq0ncy8nx8rkgzeusnefvaq");

        const result = await controller.getActionData({
            mutisigAddress: mockMultisigAddress,
            actionId: 42,
        });
        const mappedRes = result as resources.SCUpgradeFromSource;

        assert.equal(mappedRes.sourceContractAddress.toBech32(), sourceContract.toBech32());
        assert.equal(mappedRes.amount, amount);
        assert.deepEqual(mappedRes.codeMetadata, metadata);
    });

    it("getActionData returns the action data as ChangeQuorum", async function () {
        networkProvider.mockQueryContractOnFunction(
            "getActionData",
            new SmartContractQueryResponse({
                function: "getActionData",
                returnDataParts: [Buffer.from("BAAAAAI=", "base64")],
                returnCode: "ok",
                returnMessage: "ok",
            }),
        );
        const result = await controller.getActionData({
            mutisigAddress: mockMultisigAddress,
            actionId: 42,
        });
        const mappedRes = result as resources.ChangeQuorum;

        assert.equal(mappedRes.quorum, 2);
    });

    it("getActionData returns the action data as RemoveUser", async function () {
        networkProvider.mockQueryContractOnFunction(
            "getActionData",
            new SmartContractQueryResponse({
                function: "getActionData",
                returnDataParts: [Buffer.from("A4BJ1jnlppgNHNI5KrzOQQKc2nShVjUjogLwlkHMJhj4", "base64")],
                returnCode: "ok",
                returnMessage: "ok",
            }),
        );
        const result = await controller.getActionData({
            mutisigAddress: mockMultisigAddress,
            actionId: 42,
        });
        const mappedRes = result as resources.RemoveUser;

        assert.equal(mappedRes.address.toBech32(), "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");
    });

    it("getActionSigners returns the action signers as address array", async function () {
        networkProvider.mockQueryContractOnFunction(
            "getActionSigners",
            new SmartContractQueryResponse({
                function: "getActionSigners",
                returnDataParts: [
                    Buffer.from(
                        "8049d639e5a6980d1cd2392abcce41029cda74a1563523a202f09641cc2618f8b2a11555ce521e4944e09ab17549d85b487dcd26c84b5017a39e31a3670889ba",
                        "hex",
                    ),
                ],
                returnCode: "ok",
                returnMessage: "ok",
            }),
        );

        const result = await controller.getActionSigners({
            mutisigAddress: mockMultisigAddress,
            actionId: 42,
        });

        assert.equal(result.length, 2);
        assert.equal(result[0], mockBoardMemberAddress);
        assert.equal(result[1], mockProposerAddress);
    });

    it("getActionSignerCount returns the number of signers that signed an action", async function () {
        networkProvider.mockQueryContractOnFunction(
            "getActionSignerCount",
            new SmartContractQueryResponse({
                function: "getActionSignerCount",
                returnDataParts: [Buffer.from("04", "hex")],
                returnCode: "ok",
                returnMessage: "ok",
            }),
        );

        const result = await controller.getActionSignerCount({ mutisigAddress: mockMultisigAddress, actionId: 42 });

        assert.equal(result, 4);
    });

    it("getActionValidSignerCount returns the number of signers that signed an action and are still boardMembers", async function () {
        networkProvider.mockQueryContractOnFunction(
            "getActionValidSignerCount",
            new SmartContractQueryResponse({
                function: "getActionValidSignerCount",
                returnDataParts: [Buffer.from("04", "hex")],
                returnCode: "ok",
                returnMessage: "ok",
            }),
        );

        const result = await controller.getActionValidSignerCount({
            mutisigAddress: mockMultisigAddress,
            actionId: 42,
        });

        assert.equal(result, 4);
    });
});
