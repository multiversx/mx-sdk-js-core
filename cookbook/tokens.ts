import path from "path"; // md-ignore
import { Account, Address, DevnetEntrypoint, TokenManagementTransactionsOutcomeParser } from "../src"; // md-ignore
// md-start
(async () => {
    // ### Token management

    // In this section, we're going to create transactions to issue fungible tokens, issue semi-fungible tokens, create NFTs, set token roles, but also parse these transactions to extract their outcome (e.g. get the token identifier of the newly issued token).

    // These methods are available through the `TokenManagementController` and the `TokenManagementTransactionsFactory`.
    // The controller also includes built-in methods for awaiting the completion of transactions and parsing their outcomes.
    // For the factory, the same functionality can be achieved using the `TokenManagementTransactionsOutcomeParser`.

    // For scripts or quick network interactions, we recommend using the controller. However, for a more granular approach (e.g., DApps), the factory is the better choice.

    // #### Issuing fungible tokens using the controller
    // ```js
    {
        // create the entrypoint and the token management controller // md-as-comment
        const entrypoint = new DevnetEntrypoint();
        const controller = entrypoint.createTokenManagementController();

        // create the issuer of the token // md-as-comment
        const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
        const alice = await Account.newFromPem(filePath);

        // fetch the nonce of the network // md-as-comment
        alice.nonce = await entrypoint.recallAccountNonce(alice.address);

        const transaction = await controller.createTransactionForIssuingFungible(alice, alice.getNonceThenIncrement(), {
            tokenName: "NEWFNG",
            tokenTicker: "FNG",
            initialSupply: 1_000_000_000000n,
            numDecimals: 6n,
            canFreeze: false,
            canWipe: true,
            canPause: false,
            canChangeOwner: true,
            canUpgrade: true,
            canAddSpecialRoles: false,
        });

        // sending the transaction // md-as-comment
        const txHash = await entrypoint.sendTransaction(transaction);

        // wait for transaction to execute, extract the token identifier // md-as-comment
        const outcome = await controller.awaitCompletedIssueFungible(txHash);

        const tokenIdentifier = outcome[0].tokenIdentifier;
    }
    // ```

    // #### Issuing fungible tokens using the factory
    // ```js
    {
        // create the entrypoint and the token management transactions factory // md-as-comment
        const entrypoint = new DevnetEntrypoint();
        const factory = entrypoint.createTokenManagementTransactionsFactory();

        // create the issuer of the token // md-as-comment
        const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
        const alice = await Account.newFromPem(filePath);

        const transaction = await factory.createTransactionForIssuingFungible(alice.address, {
            tokenName: "NEWFNG",
            tokenTicker: "FNG",
            initialSupply: 1_000_000_000000n,
            numDecimals: 6n,
            canFreeze: false,
            canWipe: true,
            canPause: false,
            canChangeOwner: true,
            canUpgrade: true,
            canAddSpecialRoles: false,
        });
        // fetch the nonce of the network // md-as-comment
        alice.nonce = await entrypoint.recallAccountNonce(alice.address);
        transaction.nonce = alice.getNonceThenIncrement();

        // sign the transaction // md-as-comment
        transaction.signature = await alice.signTransaction(transaction);

        // sending the transaction // md-as-comment
        const txHash = await entrypoint.sendTransaction(transaction);

        // wait for transaction to execute, extract the token identifier // md-as-comment
        // if we know that the transaction is completed, we can simply call `entrypoint.get_transaction(tx_hash)` // md-as-comment
        const transactionOnNetwork = await entrypoint.awaitCompletedTransaction(txHash);

        // extract the token identifier // md-as-comment
        const parser = new TokenManagementTransactionsOutcomeParser();
        const outcome = parser.parseIssueFungible(transactionOnNetwork);
        const tokenIdentifier = outcome[0].tokenIdentifier;
    }
    // ```

    // #### Setting special roles for fungible tokens using the controller
    // ```js
    {
        // create the entrypoint and the token management controller // md-as-comment
        const entrypoint = new DevnetEntrypoint();
        const controller = entrypoint.createTokenManagementController();

        // create the issuer of the token // md-as-comment
        const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
        const alice = await Account.newFromPem(filePath);

        // fetch the nonce of the network // md-as-comment
        alice.nonce = await entrypoint.recallAccountNonce(alice.address);

        const bob = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");

        const transaction = await controller.createTransactionForSettingSpecialRoleOnFungibleToken(
            alice,
            alice.getNonceThenIncrement(),
            {
                user: bob,
                tokenIdentifier: "TEST-123456",
                addRoleLocalMint: true,
                addRoleLocalBurn: true,
                addRoleESDTTransferRole: true,
            },
        );

        // sending the transaction // md-as-comment
        const txHash = await entrypoint.sendTransaction(transaction);

        // wait for transaction to execute, extract the token identifier // md-as-comment
        const outcome = await controller.awaitCompletedSetSpecialRoleOnFungibleToken(txHash);

        const roles = outcome[0].roles;
        const user = outcome[0].userAddress;
    }
    // ```

    // #### Setting special roles for fungible tokens using the factory
    // ```js
    {
        // create the entrypoint and the token management controller // md-as-comment
        const entrypoint = new DevnetEntrypoint();
        const factory = entrypoint.createTokenManagementTransactionsFactory();

        // create the issuer of the token // md-as-comment
        const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
        const alice = await Account.newFromPem(filePath);

        const transaction = await factory.createTransactionForIssuingFungible(alice.address, {
            tokenName: "TEST",
            tokenTicker: "TEST",
            initialSupply: 100n,
            numDecimals: 0n,
            canFreeze: true,
            canWipe: true,
            canPause: true,
            canChangeOwner: true,
            canUpgrade: false,
            canAddSpecialRoles: false,
        });
        // fetch the nonce of the network // md-as-comment
        alice.nonce = await entrypoint.recallAccountNonce(alice.address);
        transaction.nonce = alice.getNonceThenIncrement();

        // sign the transaction // md-as-comment
        transaction.signature = await alice.signTransaction(transaction);

        // sending the transaction // md-as-comment
        const txHash = await entrypoint.sendTransaction(transaction);

        // wait for transaction to execute, extract the token identifier // md-as-comment
        // if we know that the transaction is completed, we can simply call `entrypoint.get_transaction(tx_hash)` // md-as-comment
        const transactionOnNetwork = await entrypoint.awaitCompletedTransaction(txHash);

        const parser = new TokenManagementTransactionsOutcomeParser();
        const outcome = parser.parseSetSpecialRole(transactionOnNetwork);

        const roles = outcome[0].roles;
        const user = outcome[0].userAddress;
    }
    // ```

    // #### Issuing semi-fungible tokens using the controller
    // ```js
    {
        // create the entrypoint and the token management controller // md-as-comment
        const entrypoint = new DevnetEntrypoint();
        const controller = entrypoint.createTokenManagementController();

        // create the issuer of the token // md-as-comment
        const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
        const alice = await Account.newFromPem(filePath);

        // fetch the nonce of the network // md-as-comment
        alice.nonce = await entrypoint.recallAccountNonce(alice.address);

        const transaction = await controller.createTransactionForIssuingSemiFungible(
            alice,
            alice.getNonceThenIncrement(),
            {
                tokenName: "NEWSEMI",
                tokenTicker: "SEMI",
                canFreeze: false,
                canWipe: true,
                canPause: false,
                canTransferNFTCreateRole: true,
                canChangeOwner: true,
                canUpgrade: true,
                canAddSpecialRoles: true,
            },
        );

        // sending the transaction // md-as-comment
        const txHash = await entrypoint.sendTransaction(transaction);

        // wait for transaction to execute, extract the token identifier // md-as-comment
        const outcome = await controller.awaitCompletedIssueSemiFungible(txHash);

        const tokenIdentifier = outcome[0].tokenIdentifier;
    }
    // ```

    // #### Issuing semi-fungible tokens using the factory
    // ```js
    {
        // create the entrypoint and the token management controller // md-as-comment
        const entrypoint = new DevnetEntrypoint();
        const factory = entrypoint.createTokenManagementTransactionsFactory();

        // create the issuer of the token // md-as-comment
        const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
        const alice = await Account.newFromPem(filePath);

        const transaction = await factory.createTransactionForIssuingSemiFungible(alice.address, {
            tokenName: "NEWSEMI",
            tokenTicker: "SEMI",
            canFreeze: false,
            canWipe: true,
            canPause: false,
            canTransferNFTCreateRole: true,
            canChangeOwner: true,
            canUpgrade: true,
            canAddSpecialRoles: true,
        });
        // fetch the nonce of the network // md-as-comment
        alice.nonce = await entrypoint.recallAccountNonce(alice.address);
        transaction.nonce = alice.getNonceThenIncrement();

        // sign the transaction // md-as-comment
        transaction.signature = await alice.signTransaction(transaction);

        // sending the transaction // md-as-comment
        const txHash = await entrypoint.sendTransaction(transaction);

        // wait for transaction to execute, extract the token identifier // md-as-comment
        const transactionOnNetwork = await entrypoint.awaitCompletedTransaction(txHash);

        // extract the token identifier // md-as-comment
        const parser = new TokenManagementTransactionsOutcomeParser();
        const outcome = parser.parseIssueSemiFungible(transactionOnNetwork);

        const tokenIdentifier = outcome[0].tokenIdentifier;
    }
    // ```

    // #### Issuing NFT collection & creating NFTs using the controller

    // ```js
    {
        // create the entrypoint and the token management controller // md-as-comment
        const entrypoint = new DevnetEntrypoint();
        const controller = entrypoint.createTokenManagementController();

        // create the issuer of the token // md-as-comment
        const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
        const alice = await Account.newFromPem(filePath);

        // fetch the nonce of the network // md-as-comment
        alice.nonce = await entrypoint.recallAccountNonce(alice.address);

        let transaction = await controller.createTransactionForIssuingNonFungible(
            alice,
            alice.getNonceThenIncrement(),
            {
                tokenName: "NEWNFT",
                tokenTicker: "NFT",
                canFreeze: false,
                canWipe: true,
                canPause: false,
                canTransferNFTCreateRole: true,
                canChangeOwner: true,
                canUpgrade: true,
                canAddSpecialRoles: true,
            },
        );

        // sending the transaction // md-as-comment
        let txHash = await entrypoint.sendTransaction(transaction);

        // wait for transaction to execute, extract the token identifier // md-as-comment
        const outcome = await controller.awaitCompletedIssueNonFungible(txHash);

        const collectionIdentifier = outcome[0].tokenIdentifier;

        // create an NFT // md-as-comment
        transaction = await controller.createTransactionForCreatingNft(alice, alice.getNonceThenIncrement(), {
            tokenIdentifier: "FRANK-aa9e8d",
            initialQuantity: 1n,
            name: "test",
            royalties: 1000,
            hash: "abba",
            attributes: Buffer.from("test"),
            uris: ["a", "b"],
        });

        // sending the transaction // md-as-comment
        txHash = await entrypoint.sendTransaction(transaction);

        // wait for transaction to execute, extract the token identifier // md-as-comment
        const outcomeNft = await controller.awaitCompletedCreateNft(txHash);

        const identifier = outcomeNft[0].tokenIdentifier;
        const nonce = outcomeNft[0].nonce;
        const initialQuantity = outcomeNft[0].initialQuantity;
    }
    // ```

    // #### Issuing NFT collection & creating NFTs using the factory
    // ```js
    {
        // create the entrypoint and the token management transdactions factory // md-as-comment
        const entrypoint = new DevnetEntrypoint();
        const factory = entrypoint.createTokenManagementTransactionsFactory();

        // create the issuer of the token // md-as-comment
        const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
        const alice = await Account.newFromPem(filePath);

        let transaction = await factory.createTransactionForIssuingNonFungible(alice.address, {
            tokenName: "NEWNFT",
            tokenTicker: "NFT",
            canFreeze: false,
            canWipe: true,
            canPause: false,
            canTransferNFTCreateRole: true,
            canChangeOwner: true,
            canUpgrade: true,
            canAddSpecialRoles: true,
        });
        // fetch the nonce of the network // md-as-comment
        alice.nonce = await entrypoint.recallAccountNonce(alice.address);
        transaction.nonce = alice.getNonceThenIncrement();

        // sign the transaction // md-as-comment
        transaction.signature = await alice.signTransaction(transaction);

        // sending the transaction // md-as-comment
        let txHash = await entrypoint.sendTransaction(transaction);

        // wait for transaction to execute, extract the token identifier // md-as-comment
        let transactionOnNetwork = await entrypoint.awaitCompletedTransaction(txHash);

        // extract the token identifier // md-as-comment
        let parser = new TokenManagementTransactionsOutcomeParser();
        let outcome = parser.parseIssueNonFungible(transactionOnNetwork);

        const collectionIdentifier = outcome[0].tokenIdentifier;

        transaction = await factory.createTransactionForCreatingNFT(alice.address, {
            tokenIdentifier: "FRANK-aa9e8d",
            initialQuantity: 1n,
            name: "test",
            royalties: 1000,
            hash: "abba",
            attributes: Buffer.from("test"),
            uris: ["a", "b"],
        });

        transaction.nonce = alice.getNonceThenIncrement();

        // sign the transaction // md-as-comment
        transaction.signature = await alice.signTransaction(transaction);

        // sending the transaction // md-as-comment
        txHash = await entrypoint.sendTransaction(transaction);

        // ### wait for transaction to execute, extract the token identifier // md-as-comment
        transactionOnNetwork = await entrypoint.awaitCompletedTransaction(txHash);

        outcome = parser.parseIssueNonFungible(transactionOnNetwork);

        const identifier = outcome[0].tokenIdentifier;
    }
    // ```

    // These are just a few examples of what you can do using the token management controller or factory. For a complete list of supported methods, please refer to the autogenerated documentation:

    // - [TokenManagementController](https://multiversx.github.io/mx-sdk-js-core/v14/classes/TokenManagementController.html)
    // - [TokenManagementTransactionsFactory](https://multiversx.github.io/mx-sdk-js-core/v14/classes/TokenManagementTransactionsFactory.html)
})().catch((e) => {
    console.log({ e });
});
