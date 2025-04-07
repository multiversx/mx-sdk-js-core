import { assert } from "chai";
import { Abi } from "../abi";
import { CodeMetadata, Token, TokenTransfer } from "../core";
import { Address } from "../core/address";
import { Transaction } from "../core/transaction";
import { TransactionsFactoryConfig } from "../core/transactionsFactoryConfig";
import { loadAbiRegistry, loadContractCode } from "../testutils";
import { MultisigTransactionsFactory } from "./multisigTransactionFactory";

describe.only("test multisig transactions factory", function () {
    const config = new TransactionsFactoryConfig({
        chainID: "D",
    });

    let bytecode: Uint8Array;
    let abi: Abi;
    let adderAbi: Abi;
    let factory: MultisigTransactionsFactory;
    before(async function () {
        bytecode = await loadContractCode("src/testdata/multisig-full.wasm");
        abi = await loadAbiRegistry("src/testdata/multisig-full.abi.json");
        adderAbi = await loadAbiRegistry("src/testdata/adder.abi.json");

        factory = new MultisigTransactionsFactory({
            config: config,
            abi: abi,
        });
    });

    it.skip("should create transaction for deploy multisig contract", function () {
        const senderAddress = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");

        const boardMemberAddress = Address.newFromBech32(
            "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx",
        );
        const proposerAddress = Address.newFromBech32("erd1k2s324ww2g0yj38qn2ch2jwctdy8mnfxep94q9arncc6xecg3xaq6mjse8");

        const board = [boardMemberAddress, proposerAddress];
        const amount = 1000000000000000000n; // 1 EGLD

        const transaction = factory.createTransactionForMultisigDeploy(senderAddress, {
            bytecode: bytecode.valueOf(),
            quorum: 2,
            board,
            amount,
        });
        const res = Buffer.from(transaction.data).toString().split("@");
        console.log(11111, res[1], res[2], res[3], res[4], res[5], res.length);
        assert.instanceOf(transaction, Transaction);
        assert.equal(transaction.sender.toBech32(), senderAddress.toBech32());
        assert.equal(transaction.receiver.toBech32(), "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu");
        assert.equal(transaction.value, amount);
        assert.equal(transaction.chainID, config.chainID);
        assert.deepEqual(
            Buffer.from(transaction.data),
            Buffer.from(
                `${bytecode}@0500@0504@02@8049d639e5a6980d1cd2392abcce41029cda74a1563523a202f09641cc2618f8@b2a11555ce521e4944e09ab17549d85b487dcd26c84b5017a39e31a3670889ba`,
            ),
        );
    });

    it("should create transaction for upgrade multisig contract", function () {
        const senderAddress = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");

        const multisigContractAddress = Address.newFromBech32(
            "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqylllslmq6y6",
        );

        const transaction = factory.createTransactionForMultisigUpgrade(senderAddress, {
            bytecode: bytecode,
            multisigContract: multisigContractAddress,
        });
        const res = Buffer.from(transaction.data).toString().split("@");
        console.log(11111, res[1], res[2], res[3], res[4], res[5], res.length);
        assert.instanceOf(transaction, Transaction);
        assert.equal(transaction.sender.toBech32(), senderAddress.toBech32());
        assert.equal(transaction.receiver.toBech32(), multisigContractAddress.toBech32());

        assert.equal(transaction.chainID, config.chainID);
        assert.deepEqual(transaction.data!, Buffer.from(`upgradeContract@${bytecode}`));
    });

    it("should create transaction for propose add board member", function () {
        const senderAddress = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");

        const boardMemberAddress = Address.newFromBech32(
            "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx",
        );
        const multisigContractAddress = Address.newFromBech32(
            "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqylllslmq6y6",
        );
        const transaction = factory.createTransactionForProposeAddBoardMember(senderAddress, {
            multisigContract: multisigContractAddress,
            boardMemberAddress: boardMemberAddress,
        });

        assert.instanceOf(transaction, Transaction);
        assert.equal(transaction.sender.toBech32(), senderAddress.toBech32());
        assert.equal(transaction.receiver.toBech32(), multisigContractAddress.toBech32());
        assert.isAbove(transaction.data.length, 0);
        assert.equal(transaction.chainID, config.chainID);
        assert.deepEqual(
            transaction.data.toString(),
            "proposeAddBoardMember@8049d639e5a6980d1cd2392abcce41029cda74a1563523a202f09641cc2618f8",
        );
    });

    it("should create transaction for propose add proposer", function () {
        const senderAddress = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");

        const proposerAddress = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");
        const multisigContractAddress = Address.newFromBech32(
            "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqylllslmq6y6",
        );
        const transaction = factory.createTransactionForProposeAddProposer(senderAddress, {
            multisigContract: multisigContractAddress,
            proposerAddress: proposerAddress,
        });

        assert.instanceOf(transaction, Transaction);
        assert.equal(transaction.sender.toBech32(), senderAddress.toBech32());
        assert.equal(transaction.receiver.toBech32(), multisigContractAddress.toBech32());
        assert.equal(transaction.chainID, config.chainID);
        assert.deepEqual(
            transaction.data.toString(),
            "proposeAddProposer@8049d639e5a6980d1cd2392abcce41029cda74a1563523a202f09641cc2618f8",
        );
    });

    it("should create transaction for propose remove user", function () {
        const senderAddress = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");

        const userAddress = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");
        const multisigContractAddress = Address.newFromBech32(
            "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqylllslmq6y6",
        );
        const transaction = factory.createTransactionForProposeRemoveUser(senderAddress, {
            multisigContract: multisigContractAddress,
            userAddress: userAddress,
        });

        assert.instanceOf(transaction, Transaction);
        assert.equal(transaction.sender.toBech32(), senderAddress.toBech32());
        assert.equal(transaction.receiver.toBech32(), multisigContractAddress.toBech32());
        assert.equal(transaction.chainID, config.chainID);
        assert.deepEqual(
            transaction.data.toString(),
            "proposeRemoveUser@8049d639e5a6980d1cd2392abcce41029cda74a1563523a202f09641cc2618f8",
        );
    });

    it("should create transaction for propose change quorum", function () {
        const senderAddress = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");

        const multisigContractAddress = Address.newFromBech32(
            "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqylllslmq6y6",
        );
        const transaction = factory.createTransactionForProposeChangeQuorum(senderAddress, {
            multisigContract: multisigContractAddress,
            newQuorum: 3,
        });

        assert.instanceOf(transaction, Transaction);
        assert.equal(transaction.sender.toBech32(), senderAddress.toBech32());
        assert.equal(transaction.receiver.toBech32(), multisigContractAddress.toBech32());
        assert.equal(transaction.chainID, config.chainID);
        assert.deepEqual(transaction.data.toString(), "proposeChangeQuorum@03");
    });

    it("should create transaction for propose transfer execute", function () {
        const senderAddress = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");
        const destinationContract = Address.newFromBech32(
            "erd1qqqqqqqqqqqqqpgq0rffvv4vk9vesqplv9ws55fxzdfaspqa8cfszy2hms",
        );
        const multisigContractAddress = Address.newFromBech32(
            "erd1qqqqqqqqqqqqqpgq6kurkz43xq8t35kx9p8rvyz5kpxe9g7qd8ssefqjw8",
        );
        const amount = 1000000000000000000n; // 1 EGLD
        const transaction = factory.createTransactionForProposeTransferExecute(senderAddress, {
            multisigContract: multisigContractAddress,
            egldAmount: amount,
            to: destinationContract,
            functionName: "add",
            functionArguments: [7],
            abi: adderAbi,
        });

        assert.instanceOf(transaction, Transaction);
        assert.equal(transaction.sender.toBech32(), senderAddress.toBech32());
        assert.equal(transaction.receiver.toBech32(), multisigContractAddress.toBech32());
        assert.isAbove(transaction.data.length, 0);
        assert.equal(transaction.chainID, config.chainID);
        assert.deepEqual(
            transaction.data.toString(),
            "proposeTransferExecute@0000000000000000050078d29632acb15998003f615d0a51261353d8041d3e13@0de0b6b3a7640000@010000000003938700@616464@07",
        );
    });

    it("should create transaction for propose transfer execute ESDT", function () {
        const senderAddress = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");
        const destinationContract = Address.newFromBech32(
            "erd1qqqqqqqqqqqqqpgqfxlljcaalgl2qfcnxcsftheju0ts36kvl3ts3qkewe",
        );

        const multisigContractAddress = Address.newFromBech32(
            "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqylllslmq6y6",
        );
        const token = new Token({
            identifier: "TEST-abcdef",
        });
        const tokenTransfer = new TokenTransfer({ token: token, amount: 1000000000000000000n });

        const transaction = factory.createTransactionForProposeTransferExecuteEsdt(senderAddress, {
            multisigContract: multisigContractAddress,
            to: destinationContract,
            tokens: [tokenTransfer],
            functionName: "distribute",
            functionArguments: [],
        });

        assert.instanceOf(transaction, Transaction);
        assert.equal(transaction.sender.toBech32(), senderAddress.toBech32());
        assert.equal(transaction.receiver.toBech32(), multisigContractAddress.toBech32());
        assert.isAbove(transaction.data.length, 0);
        assert.equal(transaction.chainID, config.chainID);
        assert.deepEqual(
            transaction.data.toString(),
            "proposeTransferExecuteEsdt@0000000000000000050049bff963bdfa3ea02713362095df32e3d708eaccfc57@0000000c53555045522d313963356335000000000000000000000008f9ccd8a1c5080000@@64697374726962757465",
        );
    });

    it("should create transaction for propose async call", function () {
        const senderAddress = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");
        const destinationContract = Address.newFromBech32(
            "erd1qqqqqqqqqqqqqpgq0rffvv4vk9vesqplv9ws55fxzdfaspqa8cfszy2hms",
        );
        const multisigContractAddress = Address.newFromBech32(
            "erd1qqqqqqqqqqqqqpgq6kurkz43xq8t35kx9p8rvyz5kpxe9g7qd8ssefqjw8",
        );
        const transaction = factory.createTransactionForProposeAsyncCall(senderAddress, {
            multisigContract: multisigContractAddress,
            nativeTransferAmount: 0n,
            to: destinationContract,
            functionName: "add",
            functionArguments: [7],
            tokenTransfers: [],
            abi: adderAbi,
        });

        assert.instanceOf(transaction, Transaction);
        assert.equal(transaction.sender.toBech32(), senderAddress.toBech32());
        assert.equal(transaction.receiver.toBech32(), multisigContractAddress.toBech32());
        assert.isAbove(transaction.data.length, 0);
        assert.equal(transaction.chainID, config.chainID);
        assert.equal(
            transaction.data.toString(),
            "proposeAsyncCall@0000000000000000050078d29632acb15998003f615d0a51261353d8041d3e13@@@616464@07",
        );
    });

    it("should create transaction for deposit the expected amount of egld", function () {
        const senderAddress = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");

        const multisigContractAddress = Address.newFromBech32(
            "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqylllslmq6y6",
        );
        const token = new Token({
            identifier: "TEST-abcdef",
        });
        const tokenTransfer = new TokenTransfer({ token: token, amount: 1000000000000000000n });

        const transaction = factory.createTransactionForDeposit(senderAddress, {
            multisigContract: multisigContractAddress,
            egldAmount: 1n,
            tokenTransfers: [],
        });

        assert.instanceOf(transaction, Transaction);
        assert.equal(transaction.sender.toBech32(), senderAddress.toBech32());
        assert.equal(transaction.receiver.toBech32(), multisigContractAddress.toBech32());
        assert.isAbove(transaction.data.length, 0);
        assert.equal(transaction.chainID, config.chainID);
        assert.equal(transaction.value, 1n);
        assert.deepEqual(transaction.data.toString(), "deposit");
    });

    it("should create transaction for deposit esdt token", function () {
        const senderAddress = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");

        const multisigContractAddress = Address.newFromBech32(
            "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqylllslmq6y6",
        );
        const token = new Token({
            identifier: "ALICE-5627f1",
        });
        const tokenTransfer = new TokenTransfer({ token: token, amount: 100n });

        const transaction = factory.createTransactionForDeposit(senderAddress, {
            multisigContract: multisigContractAddress,
            egldAmount: 0n,
            tokenTransfers: [tokenTransfer],
        });

        assert.instanceOf(transaction, Transaction);
        assert.equal(transaction.sender.toBech32(), senderAddress.toBech32());
        assert.equal(transaction.receiver.toBech32(), multisigContractAddress.toBech32());
        assert.isAbove(transaction.data.length, 0);
        assert.equal(transaction.chainID, config.chainID);
        assert.equal(transaction.value, 0n);
        assert.deepEqual(transaction.data.toString(), "ESDTTransfer@414c4943452d353632376631@64@6465706f736974");
    });

    it.only("should create transaction for propose SC deploy from source", function () {
        const amount = BigInt(50000000000000000); // 0.05 EGLD
        const metadata = new CodeMetadata(true, true, false);
        const senderAddress = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");
        const sourceContract = Address.newFromBech32("erd1qqqqqqqqqqqqqpgqd273cw3hjndqzcpts4dvq0ncy8nx8rkgzeusnefvaq");
        const multisigContractAddress = Address.newFromBech32(
            "erd1qqqqqqqqqqqqqpgq0cjuum0t436gmp446wf3yz43avp2gm2czeus8mctaf",
        );

        const transaction = factory.createTransactionForProposeSCDeployFromSource(senderAddress, {
            multisigContract: multisigContractAddress,
            amount: amount,
            source: sourceContract,
            codeMetadata: metadata,
            arguments: ["7"],
        });

        assert.instanceOf(transaction, Transaction);
        assert.equal(transaction.sender.toBech32(), senderAddress.toBech32());
        assert.equal(transaction.receiver.toBech32(), multisigContractAddress.toBech32());
        assert.isAbove(transaction.data.length, 0);
        assert.equal(transaction.chainID, config.chainID);
        assert.deepEqual(
            transaction.data.toString(),
            "proposeSCDeployFromSource@b1a2bc2ec50000@000000000000000005006abd1c3a3794da01602b855ac03e7821e6638ec81679@0500@7",
        );
    });

    it("should create transaction for propose SC upgrade from source", function () {
        const amount = BigInt(50000000000000000); // 0.05 EGLD
        const metadata = new CodeMetadata(true, true, false);
        const senderAddress = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");
        const sourceContract = Address.newFromBech32("erd1qqqqqqqqqqqqqpgqd273cw3hjndqzcpts4dvq0ncy8nx8rkgzeusnefvaq");
        const multisigContractAddress = Address.newFromBech32(
            "erd1qqqqqqqqqqqqqpgq0cjuum0t436gmp446wf3yz43avp2gm2czeus8mctaf",
        );

        const transaction = factory.createTransactionForProposeSCUpgradeFromSource(senderAddress, {
            multisigContract: multisigContractAddress,
            scAddress: multisigContractAddress,
            amount: amount,
            source: sourceContract,
            codeMetadata: metadata,
            arguments: [],
        });

        assert.instanceOf(transaction, Transaction);
        assert.equal(transaction.sender.toBech32(), senderAddress.toBech32());
        assert.equal(transaction.receiver.toBech32(), multisigContractAddress.toBech32());
        assert.isAbove(transaction.data.length, 0);
        assert.equal(transaction.chainID, config.chainID);
        assert.deepEqual(
            transaction.data.toString(),
            "proposeSCUpgradeFromSource@000000000000000005007e25ce6debac748d86b5d393120ab1eb02a46d581679@b1a2bc2ec50000@000000000000000005006abd1c3a3794da01602b855ac03e7821e6638ec81679@0500",
        );
    });

    it("should create transaction for sign action", function () {
        const senderAddress = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");

        const multisigContractAddress = Address.newFromBech32(
            "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqylllslmq6y6",
        );
        const transaction = factory.createTransactionForSignAction(senderAddress, {
            multisigContract: multisigContractAddress,
            actionId: 42,
        });

        assert.instanceOf(transaction, Transaction);
        assert.equal(transaction.sender.toBech32(), senderAddress.toBech32());
        assert.equal(transaction.receiver.toBech32(), multisigContractAddress.toBech32());
        assert.isAbove(transaction.data.length, 0);

        assert.equal(transaction.chainID, config.chainID);
        assert.deepEqual(transaction.data.toString(), "sign@2a");
    });

    it("should create transaction for sign batch", function () {
        const senderAddress = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");

        const multisigContractAddress = Address.newFromBech32(
            "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqylllslmq6y6",
        );
        const transaction = factory.createTransactionForSignBatch(senderAddress, {
            multisigContract: multisigContractAddress,
            groupId: 5,
        });

        assert.instanceOf(transaction, Transaction);
        assert.equal(transaction.sender.toBech32(), senderAddress.toBech32());
        assert.equal(transaction.receiver.toBech32(), multisigContractAddress.toBech32());
        assert.isAbove(transaction.data.length, 0);
        assert.equal(transaction.chainID, config.chainID);
        assert.deepEqual(transaction.data.toString(), "signBatch@05");
    });

    it("should create transaction for sign and perform", function () {
        const senderAddress = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");

        const multisigContractAddress = Address.newFromBech32(
            "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqylllslmq6y6",
        );
        const transaction = factory.createTransactionForSignAndPerform(senderAddress, {
            multisigContract: multisigContractAddress,
            actionId: 42,
        });

        assert.instanceOf(transaction, Transaction);
        assert.equal(transaction.sender.toBech32(), senderAddress.toBech32());
        assert.equal(transaction.receiver.toBech32(), multisigContractAddress.toBech32());
        assert.isAbove(transaction.data.length, 0);

        assert.equal(transaction.chainID, config.chainID);
        assert.deepEqual(transaction.data.toString(), "signAndPerform@2a");
    });

    it("should create transaction for unsign", function () {
        const senderAddress = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");

        const multisigContractAddress = Address.newFromBech32(
            "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqylllslmq6y6",
        );
        const transaction = factory.createTransactionForUnsign(senderAddress, {
            multisigContract: multisigContractAddress,
            actionId: 42,
        });

        assert.instanceOf(transaction, Transaction);
        assert.equal(transaction.sender.toBech32(), senderAddress.toBech32());
        assert.equal(transaction.receiver.toBech32(), multisigContractAddress.toBech32());
        assert.isAbove(transaction.data.length, 0);
        assert.deepEqual(transaction.data.toString(), "unsign@2a");
    });

    it("should create transaction for unsign for outdated board members", function () {
        const senderAddress = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");
        const multisigContractAddress = Address.newFromBech32(
            "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqylllslmq6y6",
        );
        const transaction = factory.createTransactionForUnsignForOutdatedBoardMembers(senderAddress, {
            multisigContract: multisigContractAddress,
            actionId: 42,
            outdatedBoardMembers: [1, 3, 5],
        });

        assert.instanceOf(transaction, Transaction);
        assert.equal(transaction.sender.toBech32(), senderAddress.toBech32());
        assert.equal(transaction.receiver.toBech32(), multisigContractAddress.toBech32());
        assert.isAbove(transaction.data.length, 0);
        assert.deepEqual(transaction.data.toString(), "unsignForOutdatedBoardMembers@2a@01@03@05");
    });

    it("should create transaction for perform action", function () {
        const senderAddress = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");
        const multisigContractAddress = Address.newFromBech32(
            "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqylllslmq6y6",
        );
        const transaction = factory.createTransactionForPerformAction(senderAddress, {
            multisigContract: multisigContractAddress,
            actionId: 42,
        });

        assert.instanceOf(transaction, Transaction);
        assert.equal(transaction.sender.toBech32(), senderAddress.toBech32());
        assert.equal(transaction.receiver.toBech32(), multisigContractAddress.toBech32());
        assert.isAbove(transaction.data.length, 0);
        assert.deepEqual(transaction.data.toString(), "performAction@2a");
    });

    it("should create transaction for perform batch", function () {
        const senderAddress = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");
        const multisigContractAddress = Address.newFromBech32(
            "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqylllslmq6y6",
        );
        const transaction = factory.createTransactionForPerformBatch(senderAddress, {
            multisigContract: multisigContractAddress,
            groupId: 5,
        });

        assert.instanceOf(transaction, Transaction);
        assert.equal(transaction.sender.toBech32(), senderAddress.toBech32());
        assert.equal(transaction.receiver.toBech32(), multisigContractAddress.toBech32());
        assert.isAbove(transaction.data.length, 0);
        assert.deepEqual(transaction.data.toString(), "performBatch@05");
    });

    it("should create transaction for discard action", function () {
        const senderAddress = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");

        const multisigContractAddress = Address.newFromBech32(
            "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqylllslmq6y6",
        );
        const transaction = factory.createTransactionForDiscardAction(senderAddress, {
            multisigContract: multisigContractAddress,
            actionId: 322,
        });

        assert.instanceOf(transaction, Transaction);
        assert.equal(transaction.sender.toBech32(), senderAddress.toBech32());
        assert.equal(transaction.receiver.toBech32(), multisigContractAddress.toBech32());
        assert.isAbove(transaction.data.length, 0);
        assert.equal(transaction.chainID, config.chainID);
        assert.deepEqual(transaction.data.toString(), "discardAction@0142");
    });

    it("should create transaction for discard batch", function () {
        const senderAddress = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");

        const multisigContractAddress = Address.newFromBech32(
            "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqylllslmq6y6",
        );
        const transaction = factory.createTransactionForDiscardBatch(senderAddress, {
            multisigContract: multisigContractAddress,
            actionIds: [24, 25],
        });

        assert.instanceOf(transaction, Transaction);
        assert.equal(transaction.sender.toBech32(), senderAddress.toBech32());
        assert.equal(transaction.receiver.toBech32(), multisigContractAddress.toBech32());
        assert.equal(transaction.chainID, config.chainID);
        assert.deepEqual(transaction.data.toString(), "discardBatch@18@19");
    });
});
