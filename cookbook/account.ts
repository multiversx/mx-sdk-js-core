import path from "path"; // md-ignore
import { Account, DevnetEntrypoint, KeyPair, Mnemonic, UserSecretKey } from "../src"; // md-ignore
// md-start
(async () => {
    // ## Creating Accounts

    // You can initialize an account directly from the entrypoint. Keep in mind that the account is network agnostic, meaning it doesn't matter which entrypoint is used.
    // Accounts are used for signing transactions and messages and managing the account's nonce. They can also be saved to a PEM or keystore file for future use.

    // ```js
    {
        const entrypoint = new DevnetEntrypoint();
        const account = entrypoint.createAccount();
    }
    // ```

    // ### Other Ways to Instantiate an Account

    // #### From a Secret Key
    // ```js
    {
        const secretKeyHex = "413f42575f7f26fad3317a778771212fdb80245850981e48b58a4f25e344e8f9";
        const secretKey = new UserSecretKey(Buffer.from(secretKeyHex, "hex"));

        const accountFromSecretKey = new Account(secretKey);
    }
    // ```

    // #### From a PEM file
    // ```js
    {
        const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
        const accountFromPem = Account.newFromPem(filePath);
    }
    // ```

    // #### From a Keystore File
    // ```js
    {
        const keystorePath = path.join("../src", "testdata", "testwallets", "alice.json");
        const accountFromKeystore = Account.newFromKeystore(keystorePath, "password");
    }
    // ```

    // #### From a Mnemonic
    // ```js

    const mnemonic = Mnemonic.generate();
    const accountFromMnemonic = Account.newFromMnemonic(mnemonic.toString());
    // ```

    // #### From a KeyPair

    // ```js
    const keypair = KeyPair.generate();
    const accountFromKeyPairs = Account.newFromKeypair(keypair);
    // ```

    // ### Managing the Account Nonce

    // An account has a `nonce` property that the user is responsible for managing.
    // You can fetch the nonce from the network and increment it after each transaction.
    // Each transaction must have the correct nonce, otherwise it will fail to execute.

    // ```js
    {
        const secretKeyHex = "413f42575f7f26fad3317a778771212fdb80245850981e48b58a4f25e344e8f9";
        const key = new UserSecretKey(Buffer.from(secretKeyHex, "hex"));

        const accountWithNonce = new Account(key);
        const entrypoint = new DevnetEntrypoint();

        // Fetch the current nonce from the network // md-as-comment
        accountWithNonce.nonce = await entrypoint.recallAccountNonce(accountWithNonce.address);

        // Create and send a transaction here...

        // Increment nonce after each transaction // md-as-comment
        const nonce = accountWithNonce.getNonceThenIncrement();
    }
    // ```

    // For more details, see the [Creating Transactions](#creating-transactions) section.

    // #### Saving the Account to a File

    // Accounts can be saved to either a PEM file or a keystore file.
    // While PEM wallets are less secure for storing secret keys, they are convenient for testing purposes.
    // Keystore files offer a higher level of security.

    // #### Saving the Account to a PEM File
    // ```js
    {
        const secretKeyHex = "413f42575f7f26fad3317a778771212fdb80245850981e48b58a4f25e344e8f9";
        const secretKey = new UserSecretKey(Buffer.from(secretKeyHex, "hex"));

        const account = new Account(secretKey);
        account.saveToPem(path.resolve("wallet.pem"));
    }
    // ```

    // #### Saving the Account to a Keystore File
    // ```js
    {
        const secretKeyHex = "413f42575f7f26fad3317a778771212fdb80245850981e48b58a4f25e344e8f9";
        const secretKey = new UserSecretKey(Buffer.from(secretKeyHex, "hex"));

        const account = new Account(secretKey);
        account.saveToKeystore(path.resolve("keystoreWallet.json"), "password");
    }

    // ```

    // ### Using a Ledger Device

    // You can manage your account with a Ledger device, allowing you to sign both transactions and messages while keeping your keys secure.

    // Note: **The multiversx-sdk package does not include Ledger support by default. To enable it, install the package with Ledger dependencies**:
    /* // md-ignore
// ```bash
npm install @multiversx/sdk-hw-provider
// ```
*/ // md-ignore

    // #### Creating a Ledger Account
    // This can be done using the dedicated library. You can find more information [here](https://docs.multiversx.com/sdk-and-tools/sdk-js/sdk-js-signing-providers/#the-hardware-wallet-provider).

    // When signing transactions or messages, the Ledger device will prompt you to confirm the details before proceeding.

    // ### Compatibility with IAccount Interface

    // The `Account` implements the `IAccount` interface, making it compatible with transaction controllers and any other component that expects this interface.
})().catch((e) => {
    console.log({ e });
});
