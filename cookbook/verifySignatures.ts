import path from "path"; // md-ignore
import {
    Account,
    Address,
    Message,
    MessageComputer,
    Transaction,
    TransactionComputer,
    UserPublicKey,
    UserVerifier,
} from "../src"; // md-ignore
// md-start
(async () => {
    // ## Verifying signatures

    // Signature verification is performed using an account’s public key.
    // To simplify this process, we provide wrappers over public keys that make verification easier and more convenient.

    // #### Verifying Transaction signature using a UserVerifier
    // ```js
    {
        const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
        const account = await Account.newFromPem(filePath);

        const transaction = new Transaction({
            nonce: 90n,
            sender: account.address,
            receiver: Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx"),
            value: 1000000000000000000n,
            gasLimit: 50000n,
            chainID: "D",
        });

        // sign and apply the signature on the transaction // md-as-comment
        transaction.signature = await account.signTransaction(transaction);

        // instantiating a user verifier; basically gets the public key // md-as-comment
        const alice = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const aliceVerifier = UserVerifier.fromAddress(alice);

        // serialize the transaction for verification // md-as-comment
        const transactionComputer = new TransactionComputer();
        const serializedTransaction = transactionComputer.computeBytesForVerifying(transaction);

        // verify the signature // md-as-comment
        const isSignedByAlice = aliceVerifier.verify(serializedTransaction, transaction.signature);

        console.log("Transaction is signed by Alice: ", isSignedByAlice);
    }
    // ```

    // #### Verifying Message signature using a UserVerifier

    // ```ts
    {
        const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
        const account = await Account.newFromPem(filePath);

        const message = new Message({
            data: new Uint8Array(Buffer.from("hello")),
            address: account.address,
        });

        // sign and apply the signature on the message // md-as-comment
        message.signature = await account.signMessage(message);

        // instantiating a user verifier; basically gets the public key // md-as-comment
        const alice = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const aliceVerifier = UserVerifier.fromAddress(alice);

        // serialize the message for verification // md-as-comment
        const messageComputer = new MessageComputer();
        const serializedMessage = messageComputer.computeBytesForVerifying(message);

        // verify the signature // md-as-comment
        const isSignedByAlice = await aliceVerifier.verify(serializedMessage, message.signature);

        console.log("Message is signed by Alice: ", isSignedByAlice);
    }
    // ```

    // #### Verifying a signature using a public key
    // ```js
    {
        const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
        const account = await Account.newFromPem(filePath);

        const transaction = new Transaction({
            nonce: 90n,
            sender: account.address,
            receiver: Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx"),
            value: 1000000000000000000n,
            gasLimit: 50000n,
            chainID: "D",
        });

        // sign and apply the signature on the transaction // md-as-comment
        transaction.signature = await account.signTransaction(transaction);

        // instantiating a public key // md-as-comment
        const alice = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const publicKey = new UserPublicKey(alice.getPublicKey());

        // serialize the transaction for verification // md-as-comment
        const transactionComputer = new TransactionComputer();
        const serializedTransaction = transactionComputer.computeBytesForVerifying(transaction);

        // verify the signature // md-as-comment
        const isSignedByAlice = await publicKey.verify(serializedTransaction, transaction.signature);
        console.log("Transaction is signed by Alice: ", isSignedByAlice);
    }
    // ```

    // #### Sending messages over boundaries
    // Signed Message objects are typically sent to a remote party (e.g., a service), which can then verify the signature.
    // To prepare a message for transmission, you can use the `MessageComputer.packMessage()` utility method.

    // ```js
    {
        const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
        const account = await Account.newFromPem(filePath);

        const message = new Message({
            data: new Uint8Array(Buffer.from("hello")),
            address: account.address,
        });

        // sign and apply the signature on the message // md-as-comment
        message.signature = await account.signMessage(message);

        const messageComputer = new MessageComputer();
        const packedMessage = messageComputer.packMessage(message);

        console.log("Packed message", packedMessage);
    }
    // ```

    // Then, on the receiving side, you can use `func:MessageComputer.unpackMessage()` to reconstruct the message, prior verification:

    // ```js
    {
        const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
        const alice = await Account.newFromPem(filePath);
        const messageComputer = new MessageComputer();
        const data = Buffer.from("test");

        const message = new Message({
            data: data,
            address: alice.address,
        });

        message.signature = await alice.signMessage(message);
        // restore message // md-as-comment

        const packedMessage = messageComputer.packMessage(message);
        const unpackedMessage = messageComputer.unpackMessage(packedMessage);

        // verify the signature // md-as-comment
        const isSignedByAlice = await alice.verifyMessageSignature(unpackedMessage, message.signature);

        console.log("Transaction is signed by Alice: ", isSignedByAlice);
    }
    // ```
})().catch((e) => {
    console.log({ e });
});
