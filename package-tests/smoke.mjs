// Executed by run.sh against the packed tarball: named ESM imports of the CommonJS build must resolve.
import assert from "node:assert";
import { Address, Transaction, TransactionComputer, UserSecretKey, ValidatorSecretKey } from "@multiversx/sdk-core";

const secretKey = UserSecretKey.generate();
const address = secretKey.generatePublicKey().toAddress();
assert.ok(address instanceof Address);

const transaction = new Transaction({ sender: address, receiver: address, gasLimit: 50000n, chainID: "D" });
const signature = secretKey.sign(new TransactionComputer().computeBytesForSigning(transaction));
assert.strictEqual(signature.length, 64);

// Validator keys (BLS).
const validatorSecretKey = new ValidatorSecretKey(
    Buffer.from("7cff99bd671502db7d15bc8abc0c9a804fb925406fbdd50f1e4c17a4cd774247", "hex"),
);
assert.strictEqual(
    Buffer.from(validatorSecretKey.sign(Buffer.from("hello"))).toString("hex"),
    "84fd0a3a9d4f1ea2d4b40c6da67f9b786284a1c3895b7253fec7311597cda3f757862bb0690a92a13ce612c33889fd86",
);

console.log("import: ok");
