import { assert } from "chai";
import { readFileSync } from "fs";
import path from "path";
import { Account } from "../accounts/account";
import { loadAbiRegistry } from "../testutils";
import { DevnetEntrypoint } from "./entrypoints";

describe("TestEntrypoint", function () {
    const entrypoint = new DevnetEntrypoint();

    before(async function () {});

    it("native transfer", async () => {
        const controller = entrypoint.createTransfersController();
        const filePath = path.join("src", "testdata", "testwallets", "alice.pem");
        const sender = await Account.newFromPem(filePath);
        sender.nonce = 77777n;

        const transaction = await controller.createTransactionForTransfer(
            sender,
            BigInt(sender.getNonceThenIncrement().valueOf()),
            {
                receiver: sender.address,
                nativeAmount: BigInt(0),
                data: Buffer.from("hello"),
            },
        );
        assert.equal(
            Buffer.from(transaction.signature).toString("hex"),
            "69bc7d1777edd0a901e6cf94830475716205c5efdf2fd44d4be31badead59fc8418b34f0aa3b2c80ba14aed5edd30031757d826af58a1abb690a0bee89ba9309",
        );
    });

    it("native transfer with gas options", async () => {
        const controller = entrypoint.createTransfersController();
        const filePath = path.join("src", "testdata", "testwallets", "alice.pem");
        const sender = await Account.newFromPem(filePath);
        sender.nonce = 77777n;

        const gasLimit = BigInt(50000);
        const gasPrice = BigInt(1000);

        const transaction = await controller.createTransactionForTransfer(
            sender,
            BigInt(sender.getNonceThenIncrement().valueOf()),
            {
                receiver: sender.address,
                nativeAmount: BigInt(0),
                data: Buffer.from("hello"),
                gasLimit: gasLimit,
                gasPrice: gasPrice,
            },
        );

        assert.equal(transaction.gasLimit, gasLimit, "Gas limit should be set correctly");
        assert.equal(transaction.gasPrice, gasPrice, "Gas price should be set correctly");
    });

    it("native transfer with guardian and relayer", async () => {
        const controller = entrypoint.createTransfersController();
        const filePath = path.join("src", "testdata", "testwallets");
        const sender = await Account.newFromPem(path.join(filePath, "alice.pem"));
        const grace = await Account.newFromPem(path.join(filePath, "grace.pem"));
        sender.nonce = 77777n;

        const transaction = await controller.createTransactionForTransfer(
            sender,
            BigInt(sender.getNonceThenIncrement().valueOf()),
            {
                receiver: sender.address,
                nativeAmount: BigInt(0),
                data: Buffer.from("hello"),
                guardian: grace.address,
                relayer: grace.address,
            },
        );
        assert.deepEqual(transaction.guardian, grace.address);
        assert.deepEqual(transaction.relayer, grace.address);
        assert.deepEqual(transaction.guardianSignature, new Uint8Array());

        assert.deepEqual(transaction.relayerSignature, new Uint8Array());
    });

    it("contract flow", async function () {
        this.timeout(30000);
        const abi = await loadAbiRegistry("src/testdata/adder.abi.json");
        const filePath = path.join("src", "testdata", "testwallets", "grace.pem");
        const sender = await Account.newFromPem(filePath);
        sender.nonce = await entrypoint.recallAccountNonce(sender.address);

        const controller = entrypoint.createSmartContractController(abi);
        const bytecode = readFileSync("src/testdata/adder.wasm");

        const transaction = await controller.createTransactionForDeploy(
            sender,
            BigInt(sender.getNonceThenIncrement().valueOf()),
            {
                bytecode,
                gasLimit: BigInt(10_000_000),
                arguments: [0],
            },
        );

        const txHash = await entrypoint.sendTransaction(transaction);
        const outcome = await controller.awaitCompletedDeploy(txHash);

        assert.equal(outcome.contracts.length, 1);

        const contractAddress = outcome.contracts[0].address;

        const executeTransaction = await controller.createTransactionForExecute(
            sender,
            BigInt(sender.getNonceThenIncrement().valueOf()),
            {
                contract: contractAddress,
                gasLimit: BigInt(10_000_000),
                function: "add",
                arguments: [7],
            },
        );

        const txHashExecute = await entrypoint.sendTransaction(executeTransaction);
        await entrypoint.awaitCompletedTransaction(txHashExecute);

        const queryResult = await controller.query({ contract: contractAddress, function: "getSum", arguments: [] });
        assert.equal(queryResult.length, 1);
        assert.equal(queryResult[0], 7);
    });

    it("create account", async () => {
        const account = await entrypoint.createAccount();
        assert.isNotNull(account);
        assert.isNotNull(account.address);
        assert.equal(account.secretKey.valueOf().length, 32);
        assert.equal(account.publicKey.valueOf().length, 32);
    });
});
