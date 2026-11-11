// Executed by run.sh against the packed tarball: the built package must load through require() and work.
const assert = require("node:assert");
const sdk = require("@multiversx/sdk-core");

const MNEMONIC =
    "moral volcano peasant pass circle pen over picture flat shop clap goat never lyrics gather prepare woman film husband gravity behind test tiger improve";
const EXPECTED_ADDRESS = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
const EXPECTED_TRANSACTION_HASH = "7816fd49069653631329777a2223db65c6e431a4b7721f6db9c543800247fcfa";
const EXPECTED_VALIDATOR_PUBLIC_KEY =
    "e7beaa95b3877f47348df4dd1cb578a4f7cabf7a20bfeefe5cdd263878ff132b765e04fef6f40c93512b666c47ed7719b8902f6c922c04247989b7137e837cc81a62e54712471c97a2ddab75aa9c2f58f813ed4c0fa722bde0ab718bff382208";
const EXPECTED_VALIDATOR_SIGNATURE =
    "84fd0a3a9d4f1ea2d4b40c6da67f9b786284a1c3895b7253fec7311597cda3f757862bb0690a92a13ce612c33889fd86";

async function main() {
    // Mnemonic and key derivation.
    const secretKey = sdk.Mnemonic.fromString(MNEMONIC).deriveKey(0);
    const publicKey = secretKey.generatePublicKey();
    const address = publicKey.toAddress();
    assert.strictEqual(address.toBech32(), EXPECTED_ADDRESS);

    // Transaction serialization, signing and hashing.
    const transaction = new sdk.Transaction({
        sender: address,
        receiver: address,
        gasLimit: 50000n,
        chainID: "D",
        nonce: 7n,
    });
    const computer = new sdk.TransactionComputer();
    const bytesForSigning = computer.computeBytesForSigning(transaction);
    transaction.signature = secretKey.sign(bytesForSigning);
    assert.ok(publicKey.verify(bytesForSigning, transaction.signature));
    assert.strictEqual(computer.computeTransactionHash(transaction), EXPECTED_TRANSACTION_HASH);

    // Keystore encryption and decryption.
    const keystore = sdk.UserWallet.fromSecretKey({ secretKey, password: "password" });
    assert.strictEqual(sdk.UserWallet.decryptSecretKey(keystore.toJSON(), "password").hex(), secretKey.hex());

    // Validator keys (BLS). The curve is set up on first use, not when the package is loaded (it takes a while).
    const isBlsCurveLoaded = () =>
        Object.keys(require.cache).some((file) => /@noble[\\/]curves[\\/]bls12-381/.test(file));
    assert.ok(!isBlsCurveLoaded(), "the BLS curve must not be loaded along with the package");

    // Not necessary anymore, but existing code calls it.
    await sdk.BLS.initIfNecessary();
    assert.ok(!isBlsCurveLoaded());

    const validatorSecretKey = new sdk.ValidatorSecretKey(
        Buffer.from("7cff99bd671502db7d15bc8abc0c9a804fb925406fbdd50f1e4c17a4cd774247", "hex"),
    );
    assert.ok(isBlsCurveLoaded());
    assert.strictEqual(validatorSecretKey.generatePublicKey().hex(), EXPECTED_VALIDATOR_PUBLIC_KEY);
    assert.strictEqual(
        Buffer.from(validatorSecretKey.sign(Buffer.from("hello"))).toString("hex"),
        EXPECTED_VALIDATOR_SIGNATURE,
    );

    // Network providers (optional dependency axios). Nothing is sent over the network.
    new sdk.ProxyNetworkProvider("https://localhost", { clientName: "package-tests" });
    new sdk.ApiNetworkProvider("https://localhost", { clientName: "package-tests" });

    console.log("require(): ok");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
