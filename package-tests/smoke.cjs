// Executed by run.sh against the packed tarball: the built package must load through require() and work.
const assert = require("node:assert");
const sdk = require("@multiversx/sdk-core");

const MNEMONIC =
    "moral volcano peasant pass circle pen over picture flat shop clap goat never lyrics gather prepare woman film husband gravity behind test tiger improve";
const EXPECTED_ADDRESS = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
const EXPECTED_TRANSACTION_HASH = "7816fd49069653631329777a2223db65c6e431a4b7721f6db9c543800247fcfa";

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

    // BLS (optional dependency, loads a WebAssembly module).
    await sdk.BLS.initIfNecessary();
    const blsSignature = new sdk.ValidatorSecretKey(Buffer.alloc(32, 7)).sign(Buffer.from("message"));
    assert.strictEqual(blsSignature.length, 48);

    // Network providers (optional dependency axios). Nothing is sent over the network.
    new sdk.ProxyNetworkProvider("https://localhost", { clientName: "package-tests" });
    new sdk.ApiNetworkProvider("https://localhost", { clientName: "package-tests" });

    console.log("require(): ok");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
