import path from "path"; // md-ignore
import { KeyPair, Mnemonic, UserPem, UserWallet } from "../src"; // md-ignore
// md-start
(async () => {
    // ## Wallets

    // #### Generating a mnemonic
    // Mnemonic generation is based on [bip39](https://www.npmjs.com/package/bip39) and can be achieved as follows:

    // ``` js

    const mnemonic = Mnemonic.generate();
    const words = mnemonic.getWords();
    // ```

    // #### Saving the mnemonic to a keystore file
    // The mnemonic can be saved to a keystore file:

    // ``` js
    {
        const mnemonic = Mnemonic.generate();

        // saves the mnemonic to a keystore file with kind=mnemonic // md-as-comment
        const wallet = UserWallet.fromMnemonic({ mnemonic: mnemonic.toString(), password: "password" });

        const filePath = path.join("../src", "testdata", "testwallets", "walletWithMnemonic.json");
        wallet.save(filePath);
    }
    // ```

    // #### Deriving secret keys from a mnemonic
    // Given a mnemonic, we can derive keypairs:

    // ``` js
    {
        const mnemonic = Mnemonic.generate();

        const secretKey = mnemonic.deriveKey(0);
        const publicKey = secretKey.generatePublicKey();

        console.log("Secret key: ", secretKey.hex());
        console.log("Public key: ", publicKey.hex());
    }
    // ```

    // #### Saving a secret key to a keystore file
    // The secret key can also be saved to a keystore file:

    // ``` js
    {
        const mnemonic = Mnemonic.generate();
        const secretKey = mnemonic.deriveKey();

        const wallet = UserWallet.fromSecretKey({ secretKey: secretKey, password: "password" });

        const filePath = path.join("../src", "testdata", "testwallets", "walletWithSecretKey.json");
        wallet.save(filePath);
    }
    // ```

    // #### Saving a secret key to a PEM file
    // We can save a secret key to a pem file. *This is not recommended as it is not secure, but it's very convenient for testing purposes.*

    // ``` js
    {
        const mnemonic = Mnemonic.generate();

        // by default, derives using the index = 0 // md-as-comment
        const secretKey = mnemonic.deriveKey();
        const publicKey = secretKey.generatePublicKey();

        const label = publicKey.toAddress().toBech32();
        const pem = new UserPem(label, secretKey);

        const filePath = path.join("../src", "testdata", "testwallets", "wallet.pem");
        pem.save(filePath);
    }
    // ```

    // #### Generating a KeyPair
    // A `KeyPair` is a wrapper over a secret key and a public key. We can create a keypair and use it for signing or verifying.

    // ``` js
    {
        const keypair = KeyPair.generate();

        // by default, derives using the index = 0 // md-as-comment
        const secretKey = keypair.getSecretKey();
        const publicKey = keypair.getPublicKey();
    }
    // ```

    // #### Loading a wallet from keystore mnemonic file
    // Load a keystore that holds an encrypted mnemonic (and perform wallet derivation at the same time):

    // ``` js
    {
        const filePath = path.join("../src", "testdata", "testwallets", "walletWithMnemonic.json");

        // loads the mnemonic and derives the a secret key; default index = 0 // md-as-comment
        let secretKey = UserWallet.loadSecretKey(filePath, "password");
        let address = secretKey.generatePublicKey().toAddress("erd");

        console.log("Secret key: ", secretKey.hex());
        console.log("Address: ", address.toBech32());

        // derive secret key with index = 7 // md-as-comment
        secretKey = UserWallet.loadSecretKey(filePath, "password", 7);
        address = secretKey.generatePublicKey().toAddress();

        console.log("Secret key: ", secretKey.hex());
        console.log("Address: ", address.toBech32());
    }
    // ```

    // #### Loading a wallet from a keystore secret key file

    // ``` js
    {
        const filePath = path.join("../src", "testdata", "testwallets", "walletWithSecretKey.json");

        let secretKey = UserWallet.loadSecretKey(filePath, "password");
        let address = secretKey.generatePublicKey().toAddress("erd");

        console.log("Secret key: ", secretKey.hex());
        console.log("Address: ", address.toBech32());
    }
    // ```

    // #### Loading a wallet from a PEM file

    // ``` js
    {
        const filePath = path.join("../src", "testdata", "testwallets", "wallet.pem");

        let pem = UserPem.fromFile(filePath);

        console.log("Secret key: ", pem.secretKey.hex());
        console.log("Public key: ", pem.publicKey.hex());
    }
    // ```
})().catch((e) => {
    console.log({ e });
});
