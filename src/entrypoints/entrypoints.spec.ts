import { assert } from "chai";
import { readFileSync } from "fs";
import { Account } from "../accounts/account";
import { Address } from "../address";
import { loadAbiRegistry, loadTestWallet, TestWallet } from "../testutils";
import { TransactionComputer } from "../transactionComputer";
import { DevnetEntrypoint } from "./entrypoints";

describe("TestEntrypoint", () => {
    const entrypoint = new DevnetEntrypoint();
    let alicePem: TestWallet;
    let bobPem: TestWallet;
    let txComputer: TransactionComputer;

    before(async function () {
        alicePem = await loadTestWallet("alice");
        bobPem = await loadTestWallet("bob");
        txComputer = new TransactionComputer();
    });

    it("native transfer", async () => {
        const controller = entrypoint.createTransfersController();
        const sender = Account.newFromPem(alicePem.pemFileText);
        sender.nonce = 77777;

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

    it("contract flow", async function () {
        this.timeout(30000);
        const abi = await loadAbiRegistry("src/testdata/adder.abi.json");
        const sender = Account.newFromPem(alicePem.pemFileText);
        const accountAddress = new Address(sender.address);
        sender.nonce = await entrypoint.recallAccountNonce(accountAddress);

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

        const contractAddress = Address.fromBech32(outcome.contracts[0].address);

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

    it("create relayed transaction", async function () {
        const transferController = entrypoint.createTransfersController();
        const sender = Account.newFromPem(alicePem.pemFileText);
        sender.nonce = 77777;

        const relayer = Account.newFromPem(bobPem.pemFileText);
        relayer.nonce = 7;

        const transaction = await transferController.createTransactionForTransfer(
            sender,
            BigInt(sender.getNonceThenIncrement().valueOf()),
            {
                receiver: sender.address,
                data: Buffer.from("hello"),
            },
        );
        const innerTransactionGasLimit = transaction.gasLimit;
        transaction.gasLimit = BigInt(0);
        transaction.signature = await sender.sign(txComputer.computeBytesForSigning(transaction));

        const relayedController = entrypoint.createRelayedController();
        const relayedTransaction = await relayedController.createRelayedV2Transaction(
            relayer,
            BigInt(relayer.getNonceThenIncrement().valueOf()),
            {
                innerTransaction: transaction,
                innerTransactionGasLimit,
            },
        );
        assert.equal(relayedTransaction.chainID, "D");
        assert.deepEqual(
            Buffer.from(relayedTransaction.data),
            Buffer.from(
                "relayedTxV2@0139472eff6886771a982f3083da5d421f24c29181e63888228dc81ca60d69e1@012fd1@68656c6c6f@c1eed3ac766d6b94aa53a1348d38eac8db60be0a1b2d0873247b61b8b25bbcb45bf9c1518227bcadd5044d4c027bdb935e0164243b2b2df9a5b250a10aca260e",
            ),
        );
        assert.equal(relayedTransaction.gasLimit, 442000n);
    });
});
