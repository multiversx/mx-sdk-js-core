import { assert } from "chai";
import path from "path";
import { Account } from "../accounts";
import { Address, Token, TokenTransfer } from "../core";
import { DevnetEntrypoint } from "../entrypoints/entrypoints";
import { UserSecretKey } from "../wallet";
describe("test transfers controller", function () {
    const walletsPath = path.join("src", "testdata", "testwallets");
    const sender = new Account(
        UserSecretKey.fromString("bdf3c95c4b0bcbacd828b148231a10c25f93286befe92077b5d096055fb4e96a"),
    );
    let mike = Address.newFromBech32("erd1uv40ahysflse896x4ktnh6ecx43u7cmy9wnxnvcyp7deg299a4sq6vaywa");
    let grace: Account;

    const entrypoint = new DevnetEntrypoint({ kind: "proxy", withGasLimitEstimator: true });
    const validatorController = entrypoint.createTransfersController();

    beforeEach(async function () {
        grace = await Account.newFromPem(path.join(walletsPath, "grace.pem"));
    });

    it("should send relayed with ho native balance", async function () {
        sender.nonce = await entrypoint.recallAccountNonce(sender.address);
        const token = new Token({ identifier: "USDC-350c4e" });
        const transfer = new TokenTransfer({ token: token, amount: 7n });
        const transaction = await validatorController.createTransactionForTransfer(
            sender,
            BigInt(sender.getNonceThenIncrement().valueOf()),
            {
                tokenTransfers: [transfer],
                receiver: mike,
                relayer: grace.address,
            },
        );
        transaction.relayerSignature = await grace.signTransaction(transaction);

        assert.deepEqual(
            transaction.sender,
            Address.newFromBech32("erd1th3kjm4yjd25lwewe4m5akuqsappqdml8jxuneasnavj7752veysa2sylq"),
        );
        assert.deepEqual(transaction.receiver, mike);
        assert.equal(transaction.value, 0n);
        assert.equal(transaction.chainID, "D");
        assert.equal(transaction.version, 2);
        assert.equal(transaction.gasLimit, 357001n);
        assert.equal(transaction.options, 0);
        assert.deepEqual(Buffer.from(transaction.data).toString(), "ESDTTransfer@555344432d333530633465@07");
    });
});
