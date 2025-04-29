import path from "path"; // md-ignore
import {
    Account,
    Address,
    DevnetEntrypoint,
    Token,
    TokenTransfer,
    TransactionsFactoryConfig,
    TransfersController,
    TransferTransactionsFactory,
} from "../src"; // md-ignore
// md-start
(async () => {
    // ## Creating transactions

    // In this section, we’ll explore how to create different types of transactions. To create transactions, we can use either controllers or factories.
    // Controllers are ideal for quick scripts or network interactions, while factories provide a more granular and lower-level approach, typically required for DApps.

    // Controllers typically use the same parameters as factories, but they also require an Account object and the sender’s nonce.
    // Controllers also include extra functionality, such as waiting for transaction completion and parsing transactions.
    // The same functionality can be achieved for transactions built using factories, and we’ll see how in the sections below. In the next section, we’ll learn how to create transactions using both methods.

    // ### Instantiating Controllers and Factories
    // There are two ways to create controllers and factories:
    // 1. Get them from the entrypoint.
    // 2. Manually instantiate them.

    // ```js
    {
        const entrypoint = new DevnetEntrypoint();

        // getting the controller and the factory from the entrypoint
        const transfersController = entrypoint.createTransfersController();
        const transfersFactory = entrypoint.createTransfersTransactionsFactory();

        // manually instantiating the controller and the factory
        const controller = new TransfersController({ chainID: "D" });

        const config = new TransactionsFactoryConfig({ chainID: "D" });
        const factory = new TransferTransactionsFactory({ config });
    }
    // ```

    // ### Token transfers
    // We can send both native tokens (EGLD) and ESDT tokens using either the controller or the factory.
    // #### Native Token Transfers Using the Controller
    // When using the controller, the transaction will be signed because we’ll be working with an Account.

    // ```js
    {
        const entrypoint = new DevnetEntrypoint();

        const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
        const alice = await Account.newFromPem(filePath);
        const bob = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");

        // the developer is responsible for managing the nonce
        alice.nonce = await entrypoint.recallAccountNonce(alice.address);

        const transfersController = entrypoint.createTransfersController();
        const transaction = await transfersController.createTransactionForTransfer(
            alice,
            alice.getNonceThenIncrement(),
            {
                receiver: bob,
                nativeAmount: 1n,
            },
        );

        const txHash = await entrypoint.sendTransaction(transaction);
    }
    // ```

    // If you know you’ll only be sending native tokens, you can create the transaction using the `createTransactionForNativeTokenTransfer` method.

    // #### Native Token Transfers Using the Factory
    // When using the factory, only the sender's address is required. As a result, the transaction won’t be signed, and the nonce field won’t be set correctly.
    // You will need to handle these aspects after the transaction is created.

    // ```js
    {
        const entrypoint = new DevnetEntrypoint();
        const factory = entrypoint.createTransfersTransactionsFactory();

        const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
        const alice = await Account.newFromPem(filePath);

        // the developer is responsible for managing the nonce
        alice.nonce = await entrypoint.recallAccountNonce(alice.address);

        const bob = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");

        const transaction = factory.createTransactionForTransfer(alice.address, {
            receiver: bob,
            nativeAmount: 1000000000000000000n,
        });

        // set the sender's nonce
        transaction.nonce = alice.getNonceThenIncrement();

        // sign the transaction using the sender's account
        transaction.signature = await alice.signTransaction(transaction);

        const txHash = await entrypoint.sendTransaction(transaction);
    }
    // ```

    // If you know you’ll only be sending native tokens, you can create the transaction using the `createTransactionForNativeTokenTransfer` method.

    // #### Custom token transfers using the controller

    // ```js
    {
        const entrypoint = new DevnetEntrypoint();

        const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
        const alice = await Account.newFromPem(filePath);
        const bob = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");

        // the developer is responsible for managing the nonce
        alice.nonce = await entrypoint.recallAccountNonce(alice.address);

        const esdt = new Token({ identifier: "TEST-123456" });
        const firstTransfer = new TokenTransfer({ token: esdt, amount: 1000000000n });

        const nft = new Token({ identifier: "NFT-987654", nonce: 10n });
        const secondTransfer = new TokenTransfer({ token: nft, amount: 1n });

        const sft = new Token({ identifier: "SFT-987654", nonce: 10n });
        const thirdTransfer = new TokenTransfer({ token: sft, amount: 7n });

        const transfersController = entrypoint.createTransfersController();
        const transaction = await transfersController.createTransactionForTransfer(
            alice,
            alice.getNonceThenIncrement(),
            {
                receiver: bob,
                tokenTransfers: [firstTransfer, secondTransfer, thirdTransfer],
            },
        );

        const txHash = await entrypoint.sendTransaction(transaction);
    }
    // ```

    // If you know you'll only send ESDT tokens, the same transaction can be created using createTransactionForEsdtTokenTransfer.

    // #### Custom token transfers using the factory
    // When using the factory, only the sender's address is required. As a result, the transaction won’t be signed, and the nonce field won’t be set correctly. These aspects should be handled after the transaction is created.

    // ```js
    {
        const entrypoint = new DevnetEntrypoint();
        const factory = entrypoint.createTransfersTransactionsFactory();

        const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
        const alice = await Account.newFromPem(filePath);
        const bob = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");

        // the developer is responsible for managing the nonce
        alice.nonce = await entrypoint.recallAccountNonce(alice.address);

        const esdt = new Token({ identifier: "TEST-123456" }); // fungible tokens don't have a nonce
        const firstTransfer = new TokenTransfer({ token: esdt, amount: 1000000000n }); // we set the desired amount we want to send

        const nft = new Token({ identifier: "NFT-987654", nonce: 10n });
        const secondTransfer = new TokenTransfer({ token: nft, amount: 1n }); // for NFTs we set the amount to `1`

        const sft = new Token({ identifier: "SFT-987654", nonce: 10n });
        const thirdTransfer = new TokenTransfer({ token: sft, amount: 7n }); // for SFTs we set the desired amount we want to send

        const transaction = factory.createTransactionForTransfer(alice.address, {
            receiver: bob,
            tokenTransfers: [firstTransfer, secondTransfer, thirdTransfer],
        });

        // set the sender's nonce
        transaction.nonce = alice.getNonceThenIncrement();

        // sign the transaction using the sender's account
        transaction.signature = await alice.signTransaction(transaction);

        const txHash = await entrypoint.sendTransaction(transaction);
    }
    // ```

    // If you know you'll only send ESDT tokens, the same transaction can be created using createTransactionForEsdtTokenTransfer.

    // #### Sending native and custom tokens
    // Both native and custom tokens can now be sent. If a `nativeAmount` is provided along with `tokenTransfers`, the native token will be included in the `MultiESDTNFTTransfer` built-in function call.
    // We can send both types of tokens using either the `controller` or the `factory`, but for simplicity, we’ll use the controller in this example.

    // ```js
    {
        const entrypoint = new DevnetEntrypoint();

        const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
        const alice = await Account.newFromPem(filePath);
        const bob = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");

        // the developer is responsible for managing the nonce
        alice.nonce = await entrypoint.recallAccountNonce(alice.address);

        const esdt = new Token({ identifier: "TEST-123456" });
        const firstTransfer = new TokenTransfer({ token: esdt, amount: 1000000000n });

        const nft = new Token({ identifier: "NFT-987654", nonce: 10n });
        const secondTransfer = new TokenTransfer({ token: nft, amount: 1n });

        const transfersController = entrypoint.createTransfersController();
        const transaction = await transfersController.createTransactionForTransfer(
            alice,
            alice.getNonceThenIncrement(),
            {
                receiver: bob,
                nativeAmount: 1000000000000000000n,
                tokenTransfers: [firstTransfer, secondTransfer],
            },
        );

        const txHash = await entrypoint.sendTransaction(transaction);
    }
    // ```
})().catch((e) => {
    console.log({ e });
});
