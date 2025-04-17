import path from "path"; // md-ignore
import { Account, Address, DevnetEntrypoint } from "../src"; // md-ignore
// md-start
(async () => {
    // ### Account management

    // The account management controller and factory allow us to create transactions for managing accounts, such as:
    // - Guarding and unguarding accounts
    // - Saving key-value pairs in the account storage, on the blockchain.

    // To learn more about Guardians, please refer to the [official documentation](https://docs.multiversx.com/developers/built-in-functions/#setguardian).
    // A guardian can also be set using the WebWallet, which leverages our hosted `Trusted Co-Signer Service`. Follow [this guide](https://docs.multiversx.com/wallet/web-wallet/#guardian) for step-by-step instructions on guarding an account using the wallet.

    // #### Guarding an account using the controller
    // ```js
    {
        // create the entrypoint and the account controller // md-as-comment
        const entrypoint = new DevnetEntrypoint();
        const controller = entrypoint.createAccountController();

        // create the account to guard // md-as-comment
        const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
        const alice = await Account.newFromPem(filePath);

        // fetch the nonce of the network // md-as-comment
        alice.nonce = await entrypoint.recallAccountNonce(alice.address);

        // we can use a trusted service that provides a guardian, or simply set another address we own or trust // md-as-comment
        const guardian = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");

        const transaction = await controller.createTransactionForSettingGuardian(alice, alice.getNonceThenIncrement(), {
            guardianAddress: guardian,
            serviceID: "SelfOwnedAddress", // this is just an example // md-as-comment
        });

        // sending the transaction // md-as-comment
        const txHash = await entrypoint.sendTransaction(transaction);
    }
    // ```

    // #### Guarding an account using the factory
    // ```js
    {
        // create the entrypoint and the account management factory // md-as-comment
        const entrypoint = new DevnetEntrypoint();
        const factory = entrypoint.createAccountTransactionsFactory();

        // create the account to guard // md-as-comment
        const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
        const alice = await Account.newFromPem(filePath);

        // we can use a trusted service that provides a guardian, or simply set another address we own or trust // md-as-comment
        const guardian = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");

        const transaction = await factory.createTransactionForSettingGuardian(alice.address, {
            guardianAddress: guardian,
            serviceID: "SelfOwnedAddress", // this is just an example // md-as-comment
        });
        // fetch the nonce of the network // md-as-comment
        alice.nonce = await entrypoint.recallAccountNonce(alice.address);

        // set the nonce // md-as-comment
        transaction.nonce = alice.getNonceThenIncrement();

        // sign the transaction // md-as-comment
        transaction.signature = await alice.signTransaction(transaction);

        // sending the transaction // md-as-comment
        const txHash = await entrypoint.sendTransaction(transaction);
    }
    // ```

    //  Once a guardian is set, we must wait **20 epochs** before it can be activated. After activation, all transactions sent from the account must also be signed by the guardian.

    // #### Activating the guardian using the controller
    // ```js
    {
        // create the entrypoint and the account controller // md-as-comment
        const entrypoint = new DevnetEntrypoint();
        const controller = entrypoint.createAccountController();

        // create the account to guard // md-as-comment
        const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
        const alice = await Account.newFromPem(filePath);

        // fetch the nonce of the network // md-as-comment
        alice.nonce = await entrypoint.recallAccountNonce(alice.address);

        const transaction = await controller.createTransactionForGuardingAccount(
            alice,
            alice.getNonceThenIncrement(),
            {},
        );

        // sending the transaction // md-as-comment
        const txHash = await entrypoint.sendTransaction(transaction);
    }
    // ```

    // #### Activating the guardian using the factory
    // ```js
    {
        // create the entrypoint and the account factory // md-as-comment
        const entrypoint = new DevnetEntrypoint();
        const factory = entrypoint.createAccountTransactionsFactory();

        // create the account to guard // md-as-comment
        const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
        const alice = await Account.newFromPem(filePath);

        const transaction = await factory.createTransactionForGuardingAccount(alice.address);

        // fetch the nonce of the network // md-as-comment
        alice.nonce = await entrypoint.recallAccountNonce(alice.address);

        // set the nonce // md-as-comment
        transaction.nonce = alice.getNonceThenIncrement();

        // sign the transaction // md-as-comment
        transaction.signature = await alice.signTransaction(transaction);

        // sending the transaction // md-as-comment
        const txHash = await entrypoint.sendTransaction(transaction);
    }
    // ```

    // #### Unguarding the account using the controller
    // ```js
    {
        // create the entrypoint and the account controller // md-as-comment
        const entrypoint = new DevnetEntrypoint();
        const controller = entrypoint.createAccountController();

        // create the account to unguard // md-as-comment
        const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
        const alice = await Account.newFromPem(filePath);

        // fetch the nonce of the network // md-as-comment
        alice.nonce = await entrypoint.recallAccountNonce(alice.address);

        const transaction = await controller.createTransactionForUnguardingAccount(
            alice,
            alice.getNonceThenIncrement(),
            {},
        );

        // the transaction should also be signed by the guardian before being sent otherwise it won't be executed // md-as-comment
        const txHash = await entrypoint.sendTransaction(transaction);
    }
    // ```

    // #### Unguarding the guardian using the factory
    // ```js
    {
        // create the entrypoint and the account factory // md-as-comment
        const entrypoint = new DevnetEntrypoint();
        const factory = entrypoint.createAccountTransactionsFactory();

        // create the account to guard // md-as-comment
        const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
        const alice = await Account.newFromPem(filePath);

        const transaction = await factory.createTransactionForUnguardingAccount(alice.address);

        // fetch the nonce of the network // md-as-comment
        alice.nonce = await entrypoint.recallAccountNonce(alice.address);

        // set the nonce // md-as-comment
        transaction.nonce = alice.getNonceThenIncrement();

        // sign the transaction // md-as-comment
        transaction.signature = await alice.signTransaction(transaction);

        // sending the transaction // md-as-comment
        const txHash = await entrypoint.sendTransaction(transaction);
    }
    // ```

    // #### Saving a key-value pair to an account using the controller
    // You can find more information [here](https://docs.multiversx.com/developers/account-storage) regarding the account storage.

    // ```js
    {
        // create the entrypoint and the account controller // md-as-comment
        const entrypoint = new DevnetEntrypoint();
        const controller = entrypoint.createAccountController();

        const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
        const alice = await Account.newFromPem(filePath);

        // creating the key-value pairs we want to save // md-as-comment
        const keyValuePairs = new Map([[Buffer.from("key0"), Buffer.from("value0")]]);

        // fetch the nonce of the network // md-as-comment
        alice.nonce = await entrypoint.recallAccountNonce(alice.address);

        const transaction = await controller.createTransactionForSavingKeyValue(alice, alice.getNonceThenIncrement(), {
            keyValuePairs: keyValuePairs,
        });

        // sending the transaction // md-as-comment
        const txHash = await entrypoint.sendTransaction(transaction);
    }
    // ```

    // #### Saving a key-value pair to an account using the factory
    // ```js
    {
        // create the entrypoint and the account factory // md-as-comment
        const entrypoint = new DevnetEntrypoint();
        const factory = entrypoint.createAccountTransactionsFactory();

        // create the account to guard // md-as-comment
        const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
        const alice = await Account.newFromPem(filePath);

        // creating the key-value pairs we want to save // md-as-comment
        const keyValuePairs = new Map([[Buffer.from("key0"), Buffer.from("value0")]]);

        const transaction = await factory.createTransactionForSavingKeyValue(alice.address, {
            keyValuePairs: keyValuePairs,
        });

        // fetch the nonce of the network // md-as-comment
        alice.nonce = await entrypoint.recallAccountNonce(alice.address);

        // set the nonce // md-as-comment
        transaction.nonce = alice.getNonceThenIncrement();

        // sign the transaction // md-as-comment
        transaction.signature = await alice.signTransaction(transaction);

        // sending the transaction // md-as-comment
        const txHash = await entrypoint.sendTransaction(transaction);
    }
    // ```
})().catch((e) => {
    console.log({ e });
});
