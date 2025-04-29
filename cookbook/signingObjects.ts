import path from "path"; // md-ignore
import { Account, Address, Message, MessageComputer, Transaction, TransactionComputer, UserSecretKey } from "../src"; // md-ignore
// md-start
(async () => {
    // ## Signing objects

    // Signing is done using an account's secret key. To simplify this process, we provide wrappers like [Account](#creating-accounts), which streamline signing operations.
    // First, we'll explore how to sign using an Account, followed by signing directly with a secret key.

    // #### Signing a Transaction using an Account
    // We are going to assume we have an account at this point. If you don't, feel free to check out the [creating an account](#creating-accounts) section.
    // ```js
    {
        const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
        const alice = await Account.newFromPem(filePath);

        const transaction = new Transaction({
            chainID: "D",
            sender: alice.address,
            receiver: Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx"),
            gasLimit: 50000n,
            nonce: 90n,
        });

        transaction.signature = await alice.signTransaction(transaction);
        console.log(transaction.toPlainObject());
    }
    // ```

    // #### Signing a Transaction using a SecretKey
    // ```js
    {
        const secretKeyHex = "413f42575f7f26fad3317a778771212fdb80245850981e48b58a4f25e344e8f9";
        const secretKey = UserSecretKey.fromString(secretKeyHex);
        const publickKey = secretKey.generatePublicKey();

        const transaction = new Transaction({
            nonce: 90n,
            sender: publickKey.toAddress(),
            receiver: Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx"),
            value: 1000000000000000000n,
            gasLimit: 50000n,
            chainID: "D",
        });

        // serialize the transaction // md-as-comment
        const transactionComputer = new TransactionComputer();
        const serializedTransaction = transactionComputer.computeBytesForSigning(transaction);

        // apply the signature on the transaction // md-as-comment
        transaction.signature = await secretKey.sign(serializedTransaction);

        console.log(transaction.toPlainObject());
    }
    // ```

    // #### Signing a Transaction by hash
    // ```js
    {
        const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
        const alice = await Account.newFromPem(filePath);

        const transaction = new Transaction({
            nonce: 90n,
            sender: alice.address,
            receiver: Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx"),
            value: 1000000000000000000n,
            gasLimit: 50000n,
            chainID: "D",
        });

        const transactionComputer = new TransactionComputer();

        // sets the least significant bit of the options field to `1` // md-as-comment
        transactionComputer.applyOptionsForHashSigning(transaction);

        // compute a keccak256 hash for signing // md-as-comment
        const hash = transactionComputer.computeHashForSigning(transaction);

        // sign and apply the signature on the transaction // md-as-comment
        transaction.signature = await alice.signTransaction(transaction);

        console.log(transaction.toPlainObject());
    }
    // ```

    // #### Signing a Message using an Account:
    // ```js
    {
        const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
        const alice = await Account.newFromPem(filePath);

        const message = new Message({
            data: new Uint8Array(Buffer.from("hello")),
            address: alice.address,
        });

        message.signature = await alice.signMessage(message);
    }
    // ```

    // #### Signing a Message using an SecretKey:
    // ```js
    {
        const secretKeyHex = "413f42575f7f26fad3317a778771212fdb80245850981e48b58a4f25e344e8f9";
        const secretKey = UserSecretKey.fromString(secretKeyHex);
        const publicKey = secretKey.generatePublicKey();

        const messageComputer = new MessageComputer();
        const message = new Message({
            data: new Uint8Array(Buffer.from("hello")),
            address: publicKey.toAddress(),
        });
        // serialized the message
        const serialized = messageComputer.computeBytesForSigning(message);

        message.signature = await secretKey.sign(serialized);
    }
    // ```
})().catch((e) => {
    console.log({ e });
});
