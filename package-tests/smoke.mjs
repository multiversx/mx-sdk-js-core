// Executed by run.sh against the packed tarball: named ESM imports of the CommonJS build must resolve.
import assert from "node:assert";
import { Address, Transaction, TransactionComputer, UserSecretKey } from "@multiversx/sdk-core";

const secretKey = UserSecretKey.generate();
const address = secretKey.generatePublicKey().toAddress();
assert.ok(address instanceof Address);

const transaction = new Transaction({ sender: address, receiver: address, gasLimit: 50000n, chainID: "D" });
const signature = secretKey.sign(new TransactionComputer().computeBytesForSigning(transaction));
assert.strictEqual(signature.length, 64);

console.log("import: ok");
