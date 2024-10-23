import { assert } from "chai";
import { readFileSync } from "fs";
import { Account } from "../account";
import { Address } from "../address";
import { loadAbiRegistry, loadTestWallet, TestWallet } from "../testutils";
import { DevnetEntrypoint } from "./entrypoints";

describe("TestEntrypoint", () => {
    const entrypoint = new DevnetEntrypoint();
    let alicePem: TestWallet;

    before(async function () {
        alicePem = await loadTestWallet("alice");
    });
    it("native transfer", async () => {
        const controller = entrypoint.createTransfersController();
        const sender = Account.fromPem(alicePem.pemFileText);
        sender.nonce = 77777;

        const transaction = await controller.createTransactionForTransfer(
            sender,
            BigInt(sender.getNonceThenIncrement().valueOf()),
            sender.address,
            BigInt(0),
            [],
            Buffer.from("hello"),
        );
        assert.equal(
            Buffer.from(transaction.signature).toString("hex"),
            "69bc7d1777edd0a901e6cf94830475716205c5efdf2fd44d4be31badead59fc8418b34f0aa3b2c80ba14aed5edd30031757d826af58a1abb690a0bee89ba9309",
        );
    });

    it("contract flow", async function () {
        this.timeout(30000);
        const abi = await loadAbiRegistry("src/testdata/adder.abi.json");
        const sender = Account.fromPem(alicePem.pemFileText);
        const accountAddress = new Address(sender.address.bech32());
        sender.nonce = await entrypoint.recallAccountNonce(accountAddress);

        const controller = entrypoint.createSmartContractController(abi);
        const bytecode = readFileSync("src/testdata/adder.wasm");

        const transaction = await controller.createTransactionForDeploy(
            sender,
            BigInt(sender.getNonceThenIncrement().valueOf()),
            bytecode,
            BigInt(10_000_000),
            [0],
        );

        const txHash = await entrypoint.sendTransaction(transaction);
        const outcome = await controller.awaitCompletedDeploy(txHash);

        assert.equal(outcome.contracts.length, 1);

        const contractAddress = Address.fromBech32(outcome.contracts[0].address);

        const executeTransaction = await controller.createTransactionForExecute(
            sender,
            BigInt(sender.getNonceThenIncrement().valueOf()),
            contractAddress,
            BigInt(10_000_000),
            "add",
            [7],
        );

        const txHashExecute = await entrypoint.sendTransaction(executeTransaction);
        await entrypoint.awaitCompletedTransaction(txHashExecute);

        const queryResult = await controller.queryContract(contractAddress, "getSum", []);
        assert.equal(queryResult.length, 1);
        assert.equal(queryResult[0], 7);
    });
});
