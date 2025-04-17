## Overview

This guide walks you through handling common tasks using the MultiversX Javascript SDK (v14, latest stable version).

## Creating an Entrypoint

An Entrypoint represents a network client that simplifies access to the most common operations.
There is a dedicated entrypoint for each network: `MainnetEntrypoint`,  `DevnetEntrypoint`, `TestnetEntrypoint`, `LocalnetEntrypoint`.

For example, to create a Devnet entrypoint you have the following command:

```js
const entrypoint = new DevnetEntrypoint();
```

#### Using a Custom API
If you'd like to connect to a third-party API, you can specify the url parameter:

```js
const apiEntrypoint = new DevnetEntrypoint("https://custom-multiversx-devnet-api.com");
```

#### Using a Proxy

By default, the DevnetEntrypoint uses the standard API. However, you can create a custom entrypoint that interacts with a proxy by specifying the kind parameter:

```js
const customEntrypoint = new DevnetEntrypoint("https://devnet-gateway.multiversx.com", "proxy");
```

## Creating Accounts

You can initialize an account directly from the entrypoint. Keep in mind that the account is network agnostic, meaning it doesn't matter which entrypoint is used.
Accounts are used for signing transactions and messages and managing the account's nonce. They can also be saved to a PEM or keystore file for future use.

```js
{
    const entrypoint = new DevnetEntrypoint();
    const account = entrypoint.createAccount();
}
```

### Other Ways to Instantiate an Account

#### From a Secret Key
```js
{
    const secretKeyHex = "413f42575f7f26fad3317a778771212fdb80245850981e48b58a4f25e344e8f9";
    const secretKey = new UserSecretKey(Buffer.from(secretKeyHex, "hex"));

    const accountFromSecretKey = new Account(secretKey);
}
```

#### From a PEM file
```js
{
    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const accountFromPem = Account.newFromPem(filePath);
}
```

#### From a Keystore File
```js
{
    const keystorePath = path.join("../src", "testdata", "testwallets", "alice.json");
    const accountFromKeystore = Account.newFromKeystore(keystorePath, "password");
}
```

#### From a Mnemonic
```js

const mnemonic = Mnemonic.generate();
const accountFromMnemonic = Account.newFromMnemonic(mnemonic.toString());
```

#### From a KeyPair

```js
const keypair = KeyPair.generate();
const accountFromKeyPairs = Account.newFromKeypair(keypair);
```

### Managing the Account Nonce

An account has a `nonce` property that the user is responsible for managing.
You can fetch the nonce from the network and increment it after each transaction.
Each transaction must have the correct nonce, otherwise it will fail to execute.

```js
{
    const secretKeyHex = "413f42575f7f26fad3317a778771212fdb80245850981e48b58a4f25e344e8f9";
    const key = new UserSecretKey(Buffer.from(secretKeyHex, "hex"));

    const accountWithNonce = new Account(key);
    const entrypoint = new DevnetEntrypoint();

    // Fetch the current nonce from the network
    accountWithNonce.nonce = await entrypoint.recallAccountNonce(accountWithNonce.address);

    // Create and send a transaction here...

    // Increment nonce after each transaction
    const nonce = accountWithNonce.getNonceThenIncrement();
}
```

For more details, see the [Creating Transactions](#creating-transactions) section.

#### Saving the Account to a File

Accounts can be saved to either a PEM file or a keystore file.
While PEM wallets are less secure for storing secret keys, they are convenient for testing purposes.
Keystore files offer a higher level of security.

#### Saving the Account to a PEM File
```js
{
    const secretKeyHex = "413f42575f7f26fad3317a778771212fdb80245850981e48b58a4f25e344e8f9";
    const secretKey = new UserSecretKey(Buffer.from(secretKeyHex, "hex"));

    const account = new Account(secretKey);
    account.saveToPem(path.resolve("wallet.pem"));
}
```

#### Saving the Account to a Keystore File
```js
{
    const secretKeyHex = "413f42575f7f26fad3317a778771212fdb80245850981e48b58a4f25e344e8f9";
    const secretKey = new UserSecretKey(Buffer.from(secretKeyHex, "hex"));

    const account = new Account(secretKey);
    account.saveToKeystore(path.resolve("keystoreWallet.json"), "password");
}

```

### Using a Ledger Device

You can manage your account with a Ledger device, allowing you to sign both transactions and messages while keeping your keys secure.

Note: **The multiversx-sdk package does not include Ledger support by default. To enable it, install the package with Ledger dependencies**:
```bash
npm install @multiversx/sdk-hw-provider
```

#### Creating a Ledger Account
This can be done using the dedicated library. You can find more information [here](/sdk-and-tools/sdk-js/sdk-js-signing-providers/#the-hardware-wallet-provider).

When signing transactions or messages, the Ledger device will prompt you to confirm the details before proceeding.

### Compatibility with IAccount Interface

The `Account` implements the `IAccount` interface, making it compatible with transaction controllers and any other component that expects this interface.

## Calling the Faucet

This functionality is not yet available through the entrypoint, but we recommend using the faucet available within the Web Wallet. For more details about the faucet [see this](/wallet/web-wallet/#testnet-and-devnet-faucet).

- [Testnet Wallet](https://testnet-wallet.multiversx.com/).
- [Devnet Wallet](https://devnet-wallet.multiversx.com/).

### Interacting with the network

The entrypoint exposes a few ways to directly interact with the network, such as:

- `recallAccountNonce(address: Address): Promise<bigint>;`
- `sendTransactions(transactions: Transaction[]): Promise<[number, string[]]>;`
- `sendTransaction(transaction: Transaction): Promise<string>;`
- `getTransaction(txHash: string): Promise<TransactionOnNetwork>;`
- `awaitCompletedTransaction(txHash: string): Promise<TransactionOnNetwork>;`

Some other methods are exposed through a so called **network provider**.

- **ApiNetworkProvider**: Interacts with the API, which is a layer over the proxy. It fetches data from the network and `Elastic Search`.
- **ProxyNetworkProvider**: Interacts directly with the proxy of an observing squad.

To get the underlying network provider from our entrypoint, we can do as follows:

```js
{
    const entrypoint = new DevnetEntrypoint();
    const networkProvider = entrypoint.createNetworkProvider();
}
```

### Creating a network provider
When manually instantiating a network provider, you can provide a configuration to specify the client name and set custom request options.

```js
{
    // Create a configuration object
    const config = {
        clientName: "hello-multiversx",
        requestsOptions: {
            timeout: 1000, // Timeout in milliseconds
            auth: {
                username: "user",
                password: "password",
            },
        },
    };

    // Instantiate the network provider with the config
    const api = new ApiNetworkProvider("https://devnet-api.multiversx.com", config);
}
```

A full list of available methods for `ApiNetworkProvider` can be found [here](https://multiversx.github.io/mx-sdk-js-core/v14/classes/ApiNetworkProvider.html).

Both `ApiNetworkProvider` and `ProxyNetworkProvider` implement a common interface, which can be found [here](https://multiversx.github.io/mx-sdk-js-core/v14/interfaces/INetworkProvider.html). This allows them to be used interchangeably.

The classes returned by the API expose the most commonly used fields directly for convenience. However, each object also contains a `raw` field that stores the original API response, allowing access to additional fields if needed.

## Fetching data from the network

### Fetching the network config

```js
{
    const entrypoint = new DevnetEntrypoint();
    const networkProvider = entrypoint.createNetworkProvider();

    const networkConfig = networkProvider.getNetworkConfig();
}
```

### Fetching the network status

```js
{
    const entrypoint = new DevnetEntrypoint();
    const networkProvider = entrypoint.createNetworkProvider();

    const metaNetworkStatus = networkProvider.getNetworkStatus(); // fetches status from metachain
    const networkStatus = networkProvider.getNetworkStatus(); // fetches status from shard one
}
```

### Fetching a Block from the Network
To fetch a block, we first instantiate the required arguments and use its hash. The API only supports fetching blocks by hash, whereas the **PROXY** allows fetching blocks by either hash or nonce.

When using the **PROXY**, keep in mind that the shard must also be specified in the arguments.

#### Fetching a block using the **API**
```js
{
    const api = new ApiNetworkProvider("https://devnet-api.multiversx.com");
    const blockHash = "1147e111ce8dd860ae43a0f0d403da193a940bfd30b7d7f600701dd5e02f347a";
    const block = await api.getBlock(blockHash);
}
```

Additionally, we can fetch the latest block from the network:

```js
{
    const api = new ApiNetworkProvider("https://devnet-api.multiversx.com");
    const latestBlock = await api.getLatestBlock();
}
```

#### Fetching a block using the **PROXY**

When using the proxy, we have to provide the shard, as well.
```js
{
    const proxy = new ProxyNetworkProvider("https://devnet-api.multiversx.com");
    const blockHash = "1147e111ce8dd860ae43a0f0d403da193a940bfd30b7d7f600701dd5e02f347a";
    const block = proxy.getBlock({ blockHash, shard: 1 });
}
```

We can also fetch the latest block from the network.
By default, the shard will be the metachain, but we can specify a different shard if needed.

```js
{
    const proxy = new ProxyNetworkProvider("https://devnet-api.multiversx.com");
    const latestBlock = proxy.getLatestBlock();
}
```

### Fetching an Account
To fetch an account, we need its address. Once we have the address, we create an `Address` object and pass it as an argument to the method.

```js
{
    const entrypoint = new DevnetEntrypoint();
    const api = entrypoint.createNetworkProvider();
    const alice = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
    const account = await api.getAccount(alice);
}
```

### Fetching an Account's Storage
We can also fetch an account's storage, allowing us to retrieve all key-value pairs saved for that account.

```js
{
    const entrypoint = new DevnetEntrypoint();
    const api = entrypoint.createNetworkProvider();
    const alice = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
    const account = await api.getAccountStorage(alice);
}
```

If we only want to fetch a specific key, we can do so as follows:

```js
{
    const entrypoint = new DevnetEntrypoint();
    const api = entrypoint.createNetworkProvider();
    const alice = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
    const account = await api.getAccountStorageEntry(alice, "testKey");
}
```

### Waiting for an Account to Meet a Condition
There are times when we need to wait for a specific condition to be met before proceeding with an action.
For example, let's say we want to send 7 EGLD from Alice to Bob, but this can only happen once Alice's balance reaches at least 7 EGLD.
This approach is useful in scenarios where you're waiting for external funds to be sent to Alice, enabling her to transfer the required amount to another recipient.

To implement this, we need to define the condition to check each time the account is fetched from the network. We create a function that takes an `AccountOnNetwork` object as an argument and returns a `bool`.
Keep in mind that this method has a default timeout, which can be adjusted using the `AwaitingOptions` class.

```js
{
    const entrypoint = new DevnetEntrypoint();
    const api = entrypoint.createNetworkProvider();

    const condition = (account: any) => {
        return account.balance >= 7000000000000000000n; // 7 EGLD
    };
    const alice = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
    const account = await api.awaitAccountOnCondition(alice, condition);
}
```

### Sending and Simulating Transactions
To execute transactions, we use the network providers to broadcast them to the network. Keep in mind that for transactions to be processed, they must be signed.

#### Sending a Transaction

```js
{
    const entrypoint = new DevnetEntrypoint();
    const api = entrypoint.createNetworkProvider();

    const alice = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
    const bob = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");

    const transaction = new Transaction({
        sender: alice,
        receiver: bob,
        gasLimit: 50000n,
        chainID: "D",
    });

    // set the correct nonce and sign the transaction ...

    const transactionHash = await api.sendTransaction(transaction);
}
```

#### Sending multiple transactions
```js
{
    const entrypoint = new DevnetEntrypoint();
    const api = entrypoint.createNetworkProvider();

    const alice = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
    const bob = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");

    const firstTransaction = new Transaction({
        sender: alice,
        receiver: bob,
        gasLimit: 50000n,
        chainID: "D",
        nonce: 2n,
    });

    const secondTransaction = new Transaction({
        sender: bob,
        receiver: alice,
        gasLimit: 50000n,
        chainID: "D",
        nonce: 1n,
    });

    const thirdTransaction = new Transaction({
        sender: alice,
        receiver: alice,
        gasLimit: 60000n,
        chainID: "D",
        nonce: 3n,
        data: new Uint8Array(Buffer.from("hello")),
    });

    // set the correct nonce and sign the transaction ...

    const [numOfSentTxs, hashes] = await api.sendTransactions([
        firstTransaction,
        secondTransaction,
        thirdTransaction,
    ]);
}
```

#### Simulating transactions
A transaction can be simulated before being sent for processing by the network. This is primarily used for smart contract calls, allowing you to preview the results produced by the smart contract.

```js
{
    const entrypoint = new DevnetEntrypoint();
    const api = entrypoint.createNetworkProvider();

    const alice = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
    const contract = Address.newFromBech32("erd1qqqqqqqqqqqqqpgqccmyzj9sade2495w78h42erfrw7qmqxpd8sss6gmgn");

    const transaction = new Transaction({
        sender: alice,
        receiver: contract,
        gasLimit: 5000000n,
        chainID: "D",
        data: new Uint8Array(Buffer.from("add@07")),
    });

    const transactionOnNetwork = await api.simulateTransaction(transaction);
}
```

#### Estimating the gas cost of a transaction
Before sending a transaction to the network for processing, you can retrieve the estimated gas limit required for the transaction to be executed.

```js
{
    const entrypoint = new DevnetEntrypoint();
    const api = entrypoint.createNetworkProvider();

    const alice = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
    const contract = Address.newFromBech32("erd1qqqqqqqqqqqqqpgqccmyzj9sade2495w78h42erfrw7qmqxpd8sss6gmgn");

    const nonce = await entrypoint.recallAccountNonce(alice);

    const transaction = new Transaction({
        sender: alice,
        receiver: contract,
        gasLimit: 5000000n,
        chainID: "D",
        data: new Uint8Array(Buffer.from("add@07")),
        nonce: nonce,
    });

    const transactionCostResponse = await api.estimateTransactionCost(transaction);
}
```

### Waiting for transaction completion
After sending a transaction, you may want to wait until it is processed before proceeding with another action. Keep in mind that this method has a default timeout, which can be adjusted using the `AwaitingOptions` class.

```js
{
    const entrypoint = new DevnetEntrypoint();
    const api = entrypoint.createNetworkProvider();

    const txHash = "exampletransactionhash";
    const transactionOnNetwork = await api.awaitTransactionCompleted(txHash);
}
```

### Waiting for a Transaction to Satisfy a Condition
Similar to accounts, we can wait until a transaction meets a specific condition.

```js
{
    const entrypoint = new DevnetEntrypoint();
    const api = entrypoint.createNetworkProvider();

    const condition = (txOnNetwork: any) => !txOnNetwork.status.isSuccessful();

    const txHash = "exampletransactionhash";
    const transactionOnNetwork = await api.awaitTransactionOnCondition(txHash, condition);
}
```

### Waiting for transaction completion
After sending a transaction, you may want to wait until it is processed before proceeding with another action. Keep in mind that this method has a default timeout, which can be adjusted using the `AwaitingOptions` class.

```js
{
    const entrypoint = new DevnetEntrypoint();
    const api = entrypoint.createNetworkProvider();

    const txHash = "exampletransactionhash";
    const transactionOnNetwork = await api.awaitTransactionCompleted(txHash);
}
```

### Fetching Transactions from the Network
After sending a transaction, we can fetch it from the network using the transaction hash, which we receive after broadcasting the transaction.

```js
{
    const entrypoint = new DevnetEntrypoint();
    const api = entrypoint.createNetworkProvider();

    const txHash = "exampletransactionhash";
    const transactionOnNetwork = await api.getTransaction(txHash);
}
```

### Fetching a token from an account
We can fetch a specific token (ESDT, MetaESDT, SFT, NFT) from an account by providing the account's address and the token identifier.

```js
{
    const entrypoint = new DevnetEntrypoint();
    const api = entrypoint.createNetworkProvider();

    const alice = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
    let token = new Token({ identifier: "TEST-ff155e" }); // ESDT
    let tokenOnNetwork = await api.getTokenOfAccount(alice, token);

    token = new Token({ identifier: "NFT-987654", nonce: 11n }); // NFT
    tokenOnNetwork = await api.getTokenOfAccount(alice, token);
}
```

### Fetching all fungible tokens of an account
Fetches all fungible tokens held by an account. Note that this method does not handle pagination, but it can be achieved using `doGetGeneric`.

```js
{
    const entrypoint = new DevnetEntrypoint();
    const api = entrypoint.createNetworkProvider();

    const alice = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
    const fungibleTokens = await api.getFungibleTokensOfAccount(alice);
}
```

### Fetching all non-fungible tokens of an account
Fetches all non-fungible tokens held by an account. Note that this method does not handle pagination, but it can be achieved using `doGetGeneric`.

```js
{
    const entrypoint = new DevnetEntrypoint();
    const api = entrypoint.createNetworkProvider();

    const alice = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
    const nfts = await api.getNonFungibleTokensOfAccount(alice);
}
```

### Fetching token metadata
If we want to fetch the metadata of a token (e.g., owner, decimals, etc.), we can use the following methods:

```js
{
    const entrypoint = new DevnetEntrypoint();
    const api = entrypoint.createNetworkProvider();

    // used for ESDT
    const fungibleTokenDefinition = await api.getDefinitionOfFungibleToken("TEST-ff155e");

    // used for METAESDT, SFT, NFT
    const nonFungibleTokenDefinition = await api.getDefinitionOfTokenCollection("NFTEST-ec88b8");
}
```

### Querying Smart Contracts
Smart contract queries, or view functions, are endpoints that only read data from the contract. To send a query to the observer nodes, we can proceed as follows:

```js
{
    const entrypoint = new DevnetEntrypoint();
    const api = entrypoint.createNetworkProvider();

    const query = new SmartContractQuery({
        contract: Address.newFromBech32("erd1qqqqqqqqqqqqqpgqqy34h7he2ya6qcagqre7ur7cc65vt0mxrc8qnudkr4"),
        function: "getSum",
        arguments: [],
    });
    const response = await api.queryContract(query);
}
```

### Custom Api/Proxy calls
The methods exposed by the `ApiNetworkProvider` or `ProxyNetworkProvider` are the most common and widely used. However, there may be times when custom API calls are needed. For these cases, we’ve created generic methods for both GET and POST requests.
Let’s assume we want to retrieve all the transactions sent by Alice in which the `delegate` function was called.

```js
{
    const entrypoint = new DevnetEntrypoint();
    const api = entrypoint.createNetworkProvider();

    const alice = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
    const url = `transactions/${alice.toBech32()}?function=delegate`;

    const response = await api.doGetGeneric(url);
}
```

## Creating transactions

In this section, we’ll explore how to create different types of transactions. To create transactions, we can use either controllers or factories.
Controllers are ideal for quick scripts or network interactions, while factories provide a more granular and lower-level approach, typically required for DApps.

Controllers typically use the same parameters as factories, but they also require an Account object and the sender’s nonce.
Controllers also include extra functionality, such as waiting for transaction completion and parsing transactions.
The same functionality can be achieved for transactions built using factories, and we’ll see how in the sections below. In the next section, we’ll learn how to create transactions using both methods.

### Instantiating Controllers and Factories
There are two ways to create controllers and factories:
1. Get them from the entrypoint.
2. Manually instantiate them.

```js
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
```

### Token transfers
We can send both native tokens (EGLD) and ESDT tokens using either the controller or the factory.
#### Native Token Transfers Using the Controller
When using the controller, the transaction will be signed because we’ll be working with an Account.

```js
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
```

If you know you’ll only be sending native tokens, you can create the transaction using the `createTransactionForNativeTokenTransfer` method.

#### Native Token Transfers Using the Factory
When using the factory, only the sender's address is required. As a result, the transaction won’t be signed, and the nonce field won’t be set correctly.
You will need to handle these aspects after the transaction is created.

```js
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
```

If you know you’ll only be sending native tokens, you can create the transaction using the `createTransactionForNativeTokenTransfer` method.

#### Custom token transfers using the controller

```js
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
```

If you know you'll only send ESDT tokens, the same transaction can be created using createTransactionForEsdtTokenTransfer.

#### Custom token transfers using the factory
When using the factory, only the sender's address is required. As a result, the transaction won’t be signed, and the nonce field won’t be set correctly. These aspects should be handled after the transaction is created.

```js
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
```

If you know you'll only send ESDT tokens, the same transaction can be created using createTransactionForEsdtTokenTransfer.

#### Sending native and custom tokens
Both native and custom tokens can now be sent. If a `nativeAmount` is provided along with `tokenTransfers`, the native token will be included in the `MultiESDTNFTTransfer` built-in function call.
We can send both types of tokens using either the `controller` or the `factory`, but for simplicity, we’ll use the controller in this example.

```js
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
```

### Smart Contracts

#### Contract ABIs

A contract's ABI (Application Binary Interface) describes the endpoints, data structures, and events that the contract exposes.
While interactions with the contract are possible without the ABI, they are much easier to implement when the definitions are available.

#### Loading the ABI from a file
```js
{
    let abiJson = await promises.readFile("../src/testData/adder.abi.json", { encoding: "utf8" });
    let abiObj = JSON.parse(abiJson);
    let abi = Abi.create(abiObj);
}
```

#### Loading the ABI from an URL

```js
{
    const response = await axios.get(
        "https://github.com/multiversx/mx-sdk-js-core/raw/main/src/testdata/adder.abi.json",
    );
    let abi = Abi.create(response.data);
}
```

#### Manually construct the ABI

If an ABI file isn’t available, but you know the contract’s endpoints and data types, you can manually construct the ABI.

```js
{
    let abi = Abi.create({
        endpoints: [
            {
                name: "add",
                inputs: [],
                outputs: [],
            },
        ],
    });
}
```

```js
{
    let abi = Abi.create({
        endpoints: [
            {
                name: "foo",
                inputs: [{ type: "BigUint" }, { type: "u32" }, { type: "Address" }],
                outputs: [{ type: "u32" }],
            },
            {
                name: "bar",
                inputs: [{ type: "counted-variadic<utf-8 string>" }, { type: "variadic<u64>" }],
                outputs: [],
            },
        ],
    });
}
```

### Smart Contract deployments
For creating smart contract deployment transactions, we have two options: a controller and a factory. Both function similarly to the ones used for token transfers.
When creating transactions that interact with smart contracts, it's recommended to provide the ABI file to the controller or factory if possible.
This allows arguments to be passed as native Javascript values. If the ABI is not available, but we know the expected data types, we can pass arguments as typed values (e.g., `BigUIntValue`, `ListValue`, `StructValue`, etc.) or as raw bytes.

#### Deploying a Smart Contract Using the Controller

```js
{
    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const sender = await Account.newFromPem(filePath);
    const entrypoint = new DevnetEntrypoint();

    // the developer is responsible for managing the nonce
    sender.nonce = await entrypoint.recallAccountNonce(sender.address);

    // load the contract bytecode
    const bytecode = await promises.readFile("../src/testData/adder.wasm");
    // load the abi file
    const abi = await loadAbiRegistry("../src/testdata/adder.abi.json");

    const controller = entrypoint.createSmartContractController(abi);

    // For deploy arguments, use "TypedValue" objects if you haven't provided an ABI to the factory:
    let args: any[] = [new U32Value(42)];
    // Or use simple, plain JavaScript values and objects if you have provided an ABI to the factory:
    args = [42];

    const deployTransaction = await controller.createTransactionForDeploy(sender, sender.getNonceThenIncrement(), {
        bytecode: bytecode,
        gasLimit: 6000000n,
        arguments: args,
    });

    // broadcasting the transaction
    const txHash = await entrypoint.sendTransaction(deployTransaction);
}
```

:::tip
When creating transactions using [`SmartContractController`](https://multiversx.github.io/mx-sdk-js-core/v13/classes/SmartContractController.html) or [`SmartContractTransactionsFactory`](https://multiversx.github.io/mx-sdk-js-core/v13/classes/SmartContractTransactionsFactory.html), even if the ABI is available and provided,
you can still use [`TypedValue`](https://multiversx.github.io/mx-sdk-js-core/v13/classes/TypedValue.html) objects as arguments for deployments and interactions.

Even further, you can use a mix of [`TypedValue`](https://multiversx.github.io/mx-sdk-js-core/v13/classes/TypedValue.html) objects and plain JavaScript values and objects. For example:

```js
let args = [new U32Value(42), "hello", { foo: "bar" }, new TokenIdentifierValue("TEST-abcdef")];
```
:::

#### Parsing contract deployment transactions

```js
{
    // We use the transaction hash we got when broadcasting the transaction

    const abi = await loadAbiRegistry("../src/testdata/adder.abi.json");
    const entrypoint = new DevnetEntrypoint();
    const controller = entrypoint.createSmartContractController(abi);
    const outcome = await controller.awaitCompletedDeploy("txHash"); // waits for transaction completion and parses the result
    const contractAddress = outcome.contracts[0].address;
}
```

If we want to wait for transaction completion and parse the result in two different steps, we can do as follows:

```js
{
    // We use the transaction hash we got when broadcasting the transaction
    // If we want to wait for transaction completion and parse the result in two different steps, we can do as follows:

    const entrypoint = new DevnetEntrypoint();
    const controller = entrypoint.createSmartContractController();
    const networkProvider = entrypoint.createNetworkProvider();
    const transactionOnNetwork = await networkProvider.awaitTransactionCompleted("txHash");

    // parsing the transaction
    const outcome = await controller.parseDeploy(transactionOnNetwork);
}
```

#### Computing the contract address

Even before broadcasting, at the moment you know the sender's address and the nonce for your deployment transaction, you can (deterministically) compute the (upcoming) address of the smart contract:

```js
{
    const entrypoint = new DevnetEntrypoint();
    const factory = entrypoint.createSmartContractTransactionsFactory();
    const bytecode = await promises.readFile("../contracts/adder.wasm");

    // For deploy arguments, use "TypedValue" objects if you haven't provided an ABI to the factory:
    let args: any[] = [new BigUIntValue(42)];
    // Or use simple, plain JavaScript values and objects if you have provided an ABI to the factory:
    args = [42];

    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const alice = await Account.newFromPem(filePath);
    const deployTransaction = factory.createTransactionForDeploy(alice.address, {
        bytecode: bytecode,
        gasLimit: 6000000n,
        arguments: args,
    });
    const addressComputer = new AddressComputer();
    const contractAddress = addressComputer.computeContractAddress(
        deployTransaction.sender,
        deployTransaction.nonce,
    );

    console.log("Contract address:", contractAddress.toBech32());
}
```

#### Deploying a Smart Contract using the factory
After the transaction is created the nonce needs to be properly set and the transaction should be signed before broadcasting it.

```js
{
    const entrypoint = new DevnetEntrypoint();
    const factory = entrypoint.createSmartContractTransactionsFactory();

    // load the contract bytecode
    const bytecode = await promises.readFile("../src/testData/adder.wasm");

    // For deploy arguments, use "TypedValue" objects if you haven't provided an ABI to the factory:
    let args: any[] = [new BigUIntValue(42)];
    // Or use simple, plain JavaScript values and objects if you have provided an ABI to the factory:
    args = [42];

    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const alice = await Account.newFromPem(filePath);

    const deployTransaction = await factory.createTransactionForDeploy(alice.address, {
        bytecode: bytecode,
        gasLimit: 6000000n,
        arguments: args,
    });

    // the developer is responsible for managing the nonce
    alice.nonce = await entrypoint.recallAccountNonce(alice.address);

    // set the nonce
    deployTransaction.nonce = alice.nonce;

    // sign the transaction
    deployTransaction.signature = await alice.signTransaction(deployTransaction);

    // broadcasting the transaction
    const txHash = await entrypoint.sendTransaction(deployTransaction);

    // waiting for transaction to complete
    const transactionOnNetwork = await entrypoint.awaitCompletedTransaction(txHash);

    // parsing transaction
    const parser = new SmartContractTransactionsOutcomeParser();
    const parsedOutcome = parser.parseDeploy({ transactionOnNetwork });
    const contractAddress = parsedOutcome.contracts[0].address;

    console.log(contractAddress.toBech32());
}
```

### Smart Contract calls

In this section we'll see how we can call an endpoint of our previously deployed smart contract using both approaches with the `controller` and the `factory`.

#### Calling a smart contract using the controller

```js
{
    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const sender = await Account.newFromPem(filePath);
    const entrypoint = new DevnetEntrypoint();

    // the developer is responsible for managing the nonce
    sender.nonce = await entrypoint.recallAccountNonce(sender.address);

    // load the abi file
    const abi = await loadAbiRegistry("../src/testdata/adder.abi.json");
    const controller = entrypoint.createSmartContractController(abi);

    const contractAddress = Address.newFromBech32("erd1qqqqqqqqqqqqqpgq7cmfueefdqkjsnnjnwydw902v8pwjqy3d8ssd4meug");

    // For deploy arguments, use "TypedValue" objects if you haven't provided an ABI to the factory:
    let args: any[] = [new U32Value(42)];
    // Or use simple, plain JavaScript values and objects if you have provided an ABI to the factory:
    args = [42];

    const transaction = await controller.createTransactionForExecute(sender, sender.getNonceThenIncrement(), {
        contract: contractAddress,
        gasLimit: 5000000n,
        function: "add",
        arguments: args,
    });

    // broadcasting the transaction
    const txHash = await entrypoint.sendTransaction(transaction);

    console.log(txHash);
}
```

#### Parsing smart contract call transactions
In our case, calling the add endpoint does not return anything, but similar to the example above, we could parse this transaction to get the output values of a smart contract call.

```js
{
    const entrypoint = new DevnetEntrypoint();
    const controller = entrypoint.createSmartContractController();
    const txHash = "b3ae88ad05c464a74db73f4013de05abcfcb4fb6647c67a262a6cfdf330ef4a9";
    // waits for transaction completion and parses the result
    const parsedOutcome = await controller.awaitCompletedExecute(txHash);
    const values = parsedOutcome.values;
}
```

#### Calling a smart contract and sending tokens (transfer & execute)
Additionally, if an endpoint requires a payment when called, we can send tokens to the contract while creating a smart contract call transaction.
Both EGLD and ESDT tokens or a combination of both can be sent. This functionality is supported by both the controller and the factory.

```js
{
    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const sender = await Account.newFromPem(filePath);
    const entrypoint = new DevnetEntrypoint();

    // the developer is responsible for managing the nonce
    sender.nonce = await entrypoint.recallAccountNonce(sender.address);

    // load the abi file
    const abi = await loadAbiRegistry("../src/testdata/adder.abi.json");

    // get the smart contracts controller
    const controller = entrypoint.createSmartContractController(abi);

    const contractAddress = Address.newFromBech32("erd1qqqqqqqqqqqqqpgq7cmfueefdqkjsnnjnwydw902v8pwjqy3d8ssd4meug");

    // For deploy arguments, use "TypedValue" objects if you haven't provided an ABI to the factory:
    let args: any[] = [new U32Value(42)];
    // Or use simple, plain JavaScript values and objects if you have provided an ABI to the factory:
    args = [42];

    // creating the transfers
    const firstToken = new Token({ identifier: "TEST-38f249", nonce: 10n });
    const firstTransfer = new TokenTransfer({ token: firstToken, amount: 1n });

    const secondToken = new Token({ identifier: "BAR-c80d29" });
    const secondTransfer = new TokenTransfer({ token: secondToken, amount: 10000000000000000000n });

    const transaction = await controller.createTransactionForExecute(sender, sender.getNonceThenIncrement(), {
        contract: contractAddress,
        gasLimit: 5000000n,
        function: "add",
        arguments: args,
        nativeTransferAmount: 1000000000000000000n,
        tokenTransfers: [firstTransfer, secondTransfer],
    });

    // broadcasting the transaction
    const txHash = await entrypoint.sendTransaction(transaction);

    console.log(txHash);
}
```

#### Calling a smart contract using the factory
Let's create the same smart contract call transaction, but using the `factory`.

```js
{
    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const alice = await Account.newFromPem(filePath);
    const entrypoint = new DevnetEntrypoint();

    // the developer is responsible for managing the nonce
    alice.nonce = await entrypoint.recallAccountNonce(alice.address);

    // get the smart contracts controller
    const controller = entrypoint.createSmartContractTransactionsFactory();

    const contractAddress = Address.newFromBech32("erd1qqqqqqqqqqqqqpgq7cmfueefdqkjsnnjnwydw902v8pwjqy3d8ssd4meug");

    // For deploy arguments, use "TypedValue" objects if you haven't provided an ABI to the factory:
    let args: any[] = [new U32Value(42)];
    // Or use simple, plain JavaScript values and objects if you have provided an ABI to the factory:
    args = [42];

    // creating the transfers
    const firstToken = new Token({ identifier: "TEST-38f249", nonce: 10n });
    const firstTransfer = new TokenTransfer({ token: firstToken, amount: 1n });

    const secondToken = new Token({ identifier: "BAR-c80d29" });
    const secondTransfer = new TokenTransfer({ token: secondToken, amount: 10000000000000000000n });

    const transaction = await controller.createTransactionForExecute(alice.address, {
        contract: contractAddress,
        gasLimit: 5000000n,
        function: "add",
        arguments: args,
        nativeTransferAmount: 1000000000000000000n,
        tokenTransfers: [firstTransfer, secondTransfer],
    });

    transaction.nonce = alice.getNonceThenIncrement();
    transaction.signature = await alice.signTransaction(transaction);

    // broadcasting the transaction
    const txHash = await entrypoint.sendTransaction(transaction);

    console.log(txHash);
}
```

#### Parsing transaction outcome
As said before, the `add` endpoint we called does not return anything, but we could parse the outcome of smart contract call transactions, as follows:

```js
{
    // load the abi file
    const entrypoint = new DevnetEntrypoint();
    const abi = await loadAbiRegistry("../src/testdata/adder.abi.json");
    const parser = new SmartContractTransactionsOutcomeParser({ abi });
    const txHash = "b3ae88ad05c464a74db73f4013de05abcfcb4fb6647c67a262a6cfdf330ef4a9";
    const transactionOnNetwork = await entrypoint.getTransaction(txHash);
    const outcome = parser.parseExecute({ transactionOnNetwork });
}
```

#### Decoding transaction events
You might be interested into decoding events emitted by a contract. You can do so by using the `TransactionEventsParser`.

Suppose we'd like to decode a `startPerformAction` event emitted by the [multisig](https://github.com/multiversx/mx-contracts-rs/tree/main/contracts/multisig) contract.

First, we load the abi file, then we fetch the transaction, we extract the event from the transaction and then we parse it.

```js
{
    // load the abi files
    const entrypoint = new DevnetEntrypoint();
    const abi = await loadAbiRegistry("../src/testdata/adder.abi.json");
    const parser = new TransactionEventsParser({ abi });
    const txHash = "b3ae88ad05c464a74db73f4013de05abcfcb4fb6647c67a262a6cfdf330ef4a9";
    const transactionOnNetwork = await entrypoint.getTransaction(txHash);
    const events = gatherAllEvents(transactionOnNetwork);
    const outcome = parser.parseEvents({ events });
}
```

#### Decoding transaction events
Whenever needed, the contract ABI can be used for manually encoding or decoding custom types.

Let's encode a struct called EsdtTokenPayment (of [multisig](https://github.com/multiversx/mx-contracts-rs/tree/main/contracts/multisig) contract) into binary data.
```js
{
    const abi = await loadAbiRegistry("../src/testdata/multisig-full.abi.json");
    const paymentType = abi.getStruct("EsdtTokenPayment");
    const codec = new BinaryCodec();

    const paymentStruct = new Struct(paymentType, [
        new Field(new TokenIdentifierValue("TEST-8b028f"), "token_identifier"),
        new Field(new U64Value(0n), "token_nonce"),
        new Field(new BigUIntValue(10000n), "amount"),
    ]);

    const encoded = codec.encodeNested(paymentStruct);

    console.log(encoded.toString("hex"));
}
```

Now let's decode a struct using the ABI.
```js
{
    const abi = await loadAbiRegistry("../src/testdata/multisig-full.abi.json");
    const actionStructType = abi.getEnum("Action");
    const data = Buffer.from(
        "0500000000000000000500d006f73c4221216fa679bc559005584c4f1160e569e1000000012a0000000003616464000000010000000107",
        "hex",
    );

    const codec = new BinaryCodec();
    const [decoded] = codec.decodeNested(data, actionStructType);
    const decodedValue = decoded.valueOf();
    console.log(JSON.stringify(decodedValue, null, 4));
}
```

### Smart Contract queries
When querying a smart contract, a **view function** is called. A view function does not modify the state of the contract, so we do not need to send a transaction.
To perform this query, we use the **SmartContractController**. While we can use the contract's ABI file to encode the query arguments, we can also use it to parse the result.
In this example, we will query the **adder smart contract** by calling its `getSum` endpoint.

```js
{
    const entrypoint = new DevnetEntrypoint();
    const contractAddress = Address.newFromBech32("erd1qqqqqqqqqqqqqpgq7cmfueefdqkjsnnjnwydw902v8pwjqy3d8ssd4meug");
    const abi = await loadAbiRegistry("../src/testdata/adder.abi.json");

    // create the controller
    const controller = entrypoint.createSmartContractController(abi);

    // creates the query, runs the query, parses the result
    const response = await controller.query({ contract: contractAddress, function: "getSum", arguments: [] });
}
```

If we need more granular control, we can split the process into three steps: **create the query, run the query, and parse the query response**.
This approach achieves the same result as the previous example.

```js
{
    const entrypoint = new DevnetEntrypoint();

    // load the abi
    const abi = await loadAbiRegistry("../src/testdata/adder.abi.json");

    // the contract address we'll query
    const contractAddress = Address.newFromBech32("erd1qqqqqqqqqqqqqpgq7cmfueefdqkjsnnjnwydw902v8pwjqy3d8ssd4meug");

    // create the controller
    const controller = entrypoint.createSmartContractController(abi);

    // create the query
    const query = await controller.createQuery({ contract: contractAddress, function: "getSum", arguments: [] });
    // runs the query
    const response = await controller.runQuery(query);

    // parse the result
    const parsedResponse = controller.parseQueryResponse(response);
}
```

### Upgrading a smart contract
Contract upgrade transactions are similar to deployment transactions (see above) because they also require contract bytecode.
However, in this case, the contract address is already known. Like deploying a smart contract, we can upgrade a smart contract using either the **controller** or the **factory**.

#### Uprgrading a smart contract using the controller
```js
{
    // prepare the account
    const entrypoint = new DevnetEntrypoint();
    const keystorePath = path.join("../src", "testdata", "testwallets", "alice.json");
    const sender = Account.newFromKeystore(keystorePath, "password");
    // the developer is responsible for managing the nonce
    sender.nonce = await entrypoint.recallAccountNonce(sender.address);

    // load the abi
    const abi = await loadAbiRegistry("../src/testdata/adder.abi.json");

    // create the controller
    const controller = entrypoint.createSmartContractController(abi);

    // load the contract bytecode; this is the new contract code, the one we want to upgrade to
    const bytecode = await promises.readFile("../src/testData/adder.wasm");

    // For deploy arguments, use "TypedValue" objects if you haven't provided an ABI to the factory:
    let args: any[] = [new U32Value(42)];
    // Or use simple, plain JavaScript values and objects if you have provided an ABI to the factory:
    args = [42];

    const contractAddress = Address.newFromBech32("erd1qqqqqqqqqqqqqpgq7cmfueefdqkjsnnjnwydw902v8pwjqy3d8ssd4meug");

    const upgradeTransaction = await controller.createTransactionForUpgrade(
        sender,
        sender.getNonceThenIncrement(),
        {
            contract: contractAddress,
            bytecode: bytecode,
            gasLimit: 6000000n,
            arguments: args,
        },
    );

    // broadcasting the transaction
    const txHash = await entrypoint.sendTransaction(upgradeTransaction);

    console.log({ txHash });
}
```

### Token management

In this section, we're going to create transactions to issue fungible tokens, issue semi-fungible tokens, create NFTs, set token roles, but also parse these transactions to extract their outcome (e.g. get the token identifier of the newly issued token).

These methods are available through the `TokenManagementController` and the `TokenManagementTransactionsFactory`.
The controller also includes built-in methods for awaiting the completion of transactions and parsing their outcomes.
For the factory, the same functionality can be achieved using the `TokenManagementTransactionsOutcomeParser`.

For scripts or quick network interactions, we recommend using the controller. However, for a more granular approach (e.g., DApps), the factory is the better choice.

#### Issuing fungible tokens using the controller
```js
{
    // create the entrypoint and the token management controller
    const entrypoint = new DevnetEntrypoint();
    const controller = entrypoint.createTokenManagementController();

    // create the issuer of the token
    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const alice = await Account.newFromPem(filePath);

    // fetch the nonce of the network
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

    // sending the transaction
    const txHash = await entrypoint.sendTransaction(transaction);

    // wait for transaction to execute, extract the token identifier
    const outcome = await controller.awaitCompletedIssueFungible(txHash);

    const tokenIdentifier = outcome[0].tokenIdentifier;
}
```

#### Issuing fungible tokens using the factory
```js
{
    // create the entrypoint and the token management transactions factory
    const entrypoint = new DevnetEntrypoint();
    const factory = entrypoint.createTokenManagementTransactionsFactory();

    // create the issuer of the token
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
    // fetch the nonce of the network
    alice.nonce = await entrypoint.recallAccountNonce(alice.address);
    transaction.nonce = alice.getNonceThenIncrement();

    // sign the transaction
    transaction.signature = await alice.signTransaction(transaction);

    // sending the transaction
    const txHash = await entrypoint.sendTransaction(transaction);

    // wait for transaction to execute, extract the token identifier
    // if we know that the transaction is completed, we can simply call `entrypoint.get_transaction(tx_hash)`
    const transactionOnNetwork = await entrypoint.awaitCompletedTransaction(txHash);

    // extract the token identifier
    const parser = new TokenManagementTransactionsOutcomeParser();
    const outcome = parser.parseIssueFungible(transactionOnNetwork);
    const tokenIdentifier = outcome[0].tokenIdentifier;
}
```

#### Setting special roles for fungible tokens using the controller
```js
{
    // create the entrypoint and the token management controller
    const entrypoint = new DevnetEntrypoint();
    const controller = entrypoint.createTokenManagementController();

    // create the issuer of the token
    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const alice = await Account.newFromPem(filePath);

    // fetch the nonce of the network
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

    // sending the transaction
    const txHash = await entrypoint.sendTransaction(transaction);

    // wait for transaction to execute, extract the token identifier
    const outcome = await controller.awaitCompletedSetSpecialRoleOnFungibleToken(txHash);

    const roles = outcome[0].roles;
    const user = outcome[0].userAddress;
}
```

#### Setting special roles for fungible tokens using the factory
```js
{
    // create the entrypoint and the token management controller
    const entrypoint = new DevnetEntrypoint();
    const factory = entrypoint.createTokenManagementTransactionsFactory();

    // create the issuer of the token
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
    // fetch the nonce of the network
    alice.nonce = await entrypoint.recallAccountNonce(alice.address);
    transaction.nonce = alice.getNonceThenIncrement();

    // sign the transaction
    transaction.signature = await alice.signTransaction(transaction);

    // sending the transaction
    const txHash = await entrypoint.sendTransaction(transaction);

    // wait for transaction to execute, extract the token identifier
    // if we know that the transaction is completed, we can simply call `entrypoint.get_transaction(tx_hash)`
    const transactionOnNetwork = await entrypoint.awaitCompletedTransaction(txHash);

    const parser = new TokenManagementTransactionsOutcomeParser();
    const outcome = parser.parseSetSpecialRole(transactionOnNetwork);

    const roles = outcome[0].roles;
    const user = outcome[0].userAddress;
}
```

#### Issuing semi-fungible tokens using the controller
```js
{
    // create the entrypoint and the token management controller
    const entrypoint = new DevnetEntrypoint();
    const controller = entrypoint.createTokenManagementController();

    // create the issuer of the token
    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const alice = await Account.newFromPem(filePath);

    // fetch the nonce of the network
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

    // sending the transaction
    const txHash = await entrypoint.sendTransaction(transaction);

    // wait for transaction to execute, extract the token identifier
    const outcome = await controller.awaitCompletedIssueSemiFungible(txHash);

    const tokenIdentifier = outcome[0].tokenIdentifier;
}
```

#### Issuing semi-fungible tokens using the factory
```js
{
    // create the entrypoint and the token management controller
    const entrypoint = new DevnetEntrypoint();
    const factory = entrypoint.createTokenManagementTransactionsFactory();

    // create the issuer of the token
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
    // fetch the nonce of the network
    alice.nonce = await entrypoint.recallAccountNonce(alice.address);
    transaction.nonce = alice.getNonceThenIncrement();

    // sign the transaction
    transaction.signature = await alice.signTransaction(transaction);

    // sending the transaction
    const txHash = await entrypoint.sendTransaction(transaction);

    // wait for transaction to execute, extract the token identifier
    const transactionOnNetwork = await entrypoint.awaitCompletedTransaction(txHash);

    // extract the token identifier
    const parser = new TokenManagementTransactionsOutcomeParser();
    const outcome = parser.parseIssueSemiFungible(transactionOnNetwork);

    const tokenIdentifier = outcome[0].tokenIdentifier;
}
```

#### Issuing NFT collection & creating NFTs using the controller

```js
{
    // create the entrypoint and the token management controller
    const entrypoint = new DevnetEntrypoint();
    const controller = entrypoint.createTokenManagementController();

    // create the issuer of the token
    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const alice = await Account.newFromPem(filePath);

    // fetch the nonce of the network
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

    // sending the transaction
    let txHash = await entrypoint.sendTransaction(transaction);

    // wait for transaction to execute, extract the token identifier
    const outcome = await controller.awaitCompletedIssueNonFungible(txHash);

    const collectionIdentifier = outcome[0].tokenIdentifier;

    // create an NFT
    transaction = await controller.createTransactionForCreatingNft(alice, alice.getNonceThenIncrement(), {
        tokenIdentifier: "FRANK-aa9e8d",
        initialQuantity: 1n,
        name: "test",
        royalties: 1000,
        hash: "abba",
        attributes: Buffer.from("test"),
        uris: ["a", "b"],
    });

    // sending the transaction
    txHash = await entrypoint.sendTransaction(transaction);

    // wait for transaction to execute, extract the token identifier
    const outcomeNft = await controller.awaitCompletedCreateNft(txHash);

    const identifier = outcomeNft[0].tokenIdentifier;
    const nonce = outcomeNft[0].nonce;
    const initialQuantity = outcomeNft[0].initialQuantity;
}
```

#### Issuing NFT collection & creating NFTs using the factory
```js
{
    // create the entrypoint and the token management transdactions factory
    const entrypoint = new DevnetEntrypoint();
    const factory = entrypoint.createTokenManagementTransactionsFactory();

    // create the issuer of the token
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
    // fetch the nonce of the network
    alice.nonce = await entrypoint.recallAccountNonce(alice.address);
    transaction.nonce = alice.getNonceThenIncrement();

    // sign the transaction
    transaction.signature = await alice.signTransaction(transaction);

    // sending the transaction
    let txHash = await entrypoint.sendTransaction(transaction);

    // wait for transaction to execute, extract the token identifier
    let transactionOnNetwork = await entrypoint.awaitCompletedTransaction(txHash);

    // extract the token identifier
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

    // sign the transaction
    transaction.signature = await alice.signTransaction(transaction);

    // sending the transaction
    txHash = await entrypoint.sendTransaction(transaction);

    // ### wait for transaction to execute, extract the token identifier
    transactionOnNetwork = await entrypoint.awaitCompletedTransaction(txHash);

    outcome = parser.parseIssueNonFungible(transactionOnNetwork);

    const identifier = outcome[0].tokenIdentifier;
}
```

These are just a few examples of what you can do using the token management controller or factory. For a complete list of supported methods, please refer to the autogenerated documentation:

- [TokenManagementController](https://multiversx.github.io/mx-sdk-js-core/v14/classes/TokenManagementController.html)
- [TokenManagementTransactionsFactory](https://multiversx.github.io/mx-sdk-js-core/v14/classes/TokenManagementTransactionsFactory.html)

### Account management

The account management controller and factory allow us to create transactions for managing accounts, such as:
- Guarding and unguarding accounts
- Saving key-value pairs in the account storage, on the blockchain.

To learn more about Guardians, please refer to the [official documentation](/developers/built-in-functions/#setguardian).
A guardian can also be set using the WebWallet, which leverages our hosted `Trusted Co-Signer Service`. Follow [this guide](/wallet/web-wallet/#guardian) for step-by-step instructions on guarding an account using the wallet.

#### Guarding an account using the controller
```js
{
    // create the entrypoint and the account controller
    const entrypoint = new DevnetEntrypoint();
    const controller = entrypoint.createAccountController();

    // create the account to guard
    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const alice = await Account.newFromPem(filePath);

    // fetch the nonce of the network
    alice.nonce = await entrypoint.recallAccountNonce(alice.address);

    // we can use a trusted service that provides a guardian, or simply set another address we own or trust
    const guardian = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");

    const transaction = await controller.createTransactionForSettingGuardian(alice, alice.getNonceThenIncrement(), {
        guardianAddress: guardian,
        serviceID: "SelfOwnedAddress", // this is just an example
    });

    // sending the transaction
    const txHash = await entrypoint.sendTransaction(transaction);
}
```

#### Guarding an account using the factory
```js
{
    // create the entrypoint and the account management factory
    const entrypoint = new DevnetEntrypoint();
    const factory = entrypoint.createAccountTransactionsFactory();

    // create the account to guard
    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const alice = await Account.newFromPem(filePath);

    // we can use a trusted service that provides a guardian, or simply set another address we own or trust
    const guardian = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");

    const transaction = await factory.createTransactionForSettingGuardian(alice.address, {
        guardianAddress: guardian,
        serviceID: "SelfOwnedAddress", // this is just an example
    });
    // fetch the nonce of the network
    alice.nonce = await entrypoint.recallAccountNonce(alice.address);

    // set the nonce
    transaction.nonce = alice.getNonceThenIncrement();

    // sign the transaction
    transaction.signature = await alice.signTransaction(transaction);

    // sending the transaction
    const txHash = await entrypoint.sendTransaction(transaction);
}
```

Once a guardian is set, we must wait **20 epochs** before it can be activated. After activation, all transactions sent from the account must also be signed by the guardian.

#### Activating the guardian using the controller
```js
{
    // create the entrypoint and the account controller
    const entrypoint = new DevnetEntrypoint();
    const controller = entrypoint.createAccountController();

    // create the account to guard
    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const alice = await Account.newFromPem(filePath);

    // fetch the nonce of the network
    alice.nonce = await entrypoint.recallAccountNonce(alice.address);

    const transaction = await controller.createTransactionForGuardingAccount(
        alice,
        alice.getNonceThenIncrement(),
        {},
    );

    // sending the transaction
    const txHash = await entrypoint.sendTransaction(transaction);
}
```

#### Activating the guardian using the factory
```js
{
    // create the entrypoint and the account factory
    const entrypoint = new DevnetEntrypoint();
    const factory = entrypoint.createAccountTransactionsFactory();

    // create the account to guard
    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const alice = await Account.newFromPem(filePath);

    const transaction = await factory.createTransactionForGuardingAccount(alice.address);

    // fetch the nonce of the network
    alice.nonce = await entrypoint.recallAccountNonce(alice.address);

    // set the nonce
    transaction.nonce = alice.getNonceThenIncrement();

    // sign the transaction
    transaction.signature = await alice.signTransaction(transaction);

    // sending the transaction
    const txHash = await entrypoint.sendTransaction(transaction);
}
```

#### Unguarding the account using the controller
```js
{
    // create the entrypoint and the account controller
    const entrypoint = new DevnetEntrypoint();
    const controller = entrypoint.createAccountController();

    // create the account to unguard
    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const alice = await Account.newFromPem(filePath);

    // fetch the nonce of the network
    alice.nonce = await entrypoint.recallAccountNonce(alice.address);

    const transaction = await controller.createTransactionForUnguardingAccount(
        alice,
        alice.getNonceThenIncrement(),
        {},
    );

    // the transaction should also be signed by the guardian before being sent otherwise it won't be executed
    const txHash = await entrypoint.sendTransaction(transaction);
}
```

#### Unguarding the guardian using the factory
```js
{
    // create the entrypoint and the account factory
    const entrypoint = new DevnetEntrypoint();
    const factory = entrypoint.createAccountTransactionsFactory();

    // create the account to guard
    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const alice = await Account.newFromPem(filePath);

    const transaction = await factory.createTransactionForUnguardingAccount(alice.address);

    // fetch the nonce of the network
    alice.nonce = await entrypoint.recallAccountNonce(alice.address);

    // set the nonce
    transaction.nonce = alice.getNonceThenIncrement();

    // sign the transaction
    transaction.signature = await alice.signTransaction(transaction);

    // sending the transaction
    const txHash = await entrypoint.sendTransaction(transaction);
}
```

#### Saving a key-value pair to an account using the controller
You can find more information [here](/developers/account-storage) regarding the account storage.

```js
{
    // create the entrypoint and the account controller
    const entrypoint = new DevnetEntrypoint();
    const controller = entrypoint.createAccountController();

    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const alice = await Account.newFromPem(filePath);

    // creating the key-value pairs we want to save
    const keyValuePairs = new Map([[Buffer.from("key0"), Buffer.from("value0")]]);

    // fetch the nonce of the network
    alice.nonce = await entrypoint.recallAccountNonce(alice.address);

    const transaction = await controller.createTransactionForSavingKeyValue(alice, alice.getNonceThenIncrement(), {
        keyValuePairs: keyValuePairs,
    });

    // sending the transaction
    const txHash = await entrypoint.sendTransaction(transaction);
}
```

#### Saving a key-value pair to an account using the factory
```js
{
    // create the entrypoint and the account factory
    const entrypoint = new DevnetEntrypoint();
    const factory = entrypoint.createAccountTransactionsFactory();

    // create the account to guard
    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const alice = await Account.newFromPem(filePath);

    // creating the key-value pairs we want to save
    const keyValuePairs = new Map([[Buffer.from("key0"), Buffer.from("value0")]]);

    const transaction = await factory.createTransactionForSavingKeyValue(alice.address, {
        keyValuePairs: keyValuePairs,
    });

    // fetch the nonce of the network
    alice.nonce = await entrypoint.recallAccountNonce(alice.address);

    // set the nonce
    transaction.nonce = alice.getNonceThenIncrement();

    // sign the transaction
    transaction.signature = await alice.signTransaction(transaction);

    // sending the transaction
    const txHash = await entrypoint.sendTransaction(transaction);
}
```

### Delegation management

To learn more about staking providers and delegation, please refer to the official [documentation](/validators/delegation-manager/#introducing-staking-providers).
In this section, we'll cover how to:
- Create a new delegation contract
- Retrieve the contract address
- Delegate funds to the contract
- Redelegate rewards
- Claim rewards
- Undelegate and withdraw funds

These operations can be performed using both the controller and the **factory**. For a complete list of supported methods, please refer to the autogenerated documentation:
- [DelegationController](https://multiversx.github.io/mx-sdk-js-core/v14/classes/DelegationController.html)
- [DelegationTransactionsFactory](https://multiversx.github.io/mx-sdk-js-core/v14/classes/DelegationTransactionsFactory.html)

#### Creating a New Delegation Contract Using the Controller
```js
{
    // create the entrypoint and the delegation controller
    const entrypoint = new DevnetEntrypoint();
    const controller = entrypoint.createDelegationController();

    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const alice = await Account.newFromPem(filePath);

    // fetch the nonce of the network
    alice.nonce = await entrypoint.recallAccountNonce(alice.address);

    const transaction = await controller.createTransactionForNewDelegationContract(
        alice,
        alice.getNonceThenIncrement(),
        {
            totalDelegationCap: 0n,
            serviceFee: 10n,
            amount: 1250000000000000000000n,
        },
    );

    // sending the transaction
    const txHash = await entrypoint.sendTransaction(transaction);

    // wait for transaction completion, extract delegation contract's address
    const outcome = await controller.awaitCompletedCreateNewDelegationContract(txHash);

    const contractAddress = outcome[0].contractAddress;
}
```

#### Creating a new delegation contract using the factory
```js
{
    // create the entrypoint and the delegation factory
    const entrypoint = new DevnetEntrypoint();
    const factory = entrypoint.createDelegationTransactionsFactory();

    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const alice = await Account.newFromPem(filePath);

    const transaction = await factory.createTransactionForNewDelegationContract(alice.address, {
        totalDelegationCap: 0n,
        serviceFee: 10n,
        amount: 1250000000000000000000n,
    });
    // fetch the nonce of the network
    alice.nonce = await entrypoint.recallAccountNonce(alice.address);

    // set the nonce
    transaction.nonce = alice.getNonceThenIncrement();

    // sign the transaction
    transaction.signature = await alice.signTransaction(transaction);

    // sending the transaction
    const txHash = await entrypoint.sendTransaction(transaction);

    // waits until the transaction is processed and fetches it from the network
    const transactionOnNetwork = await entrypoint.awaitCompletedTransaction(txHash);

    // extract the token identifier
    const parser = new TokenManagementTransactionsOutcomeParser();
    const outcome = parser.parseIssueFungible(transactionOnNetwork);
    const tokenIdentifier = outcome[0].tokenIdentifier;
}
```

#### Delegating funds to the contract using the Controller
We can send funds to a delegation contract to earn rewards.

```js
{
    // create the entrypoint and the delegation controller
    const entrypoint = new DevnetEntrypoint();
    const controller = entrypoint.createDelegationController();

    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const alice = await Account.newFromPem(filePath);

    // fetch the nonce of the network
    alice.nonce = await entrypoint.recallAccountNonce(alice.address);

    const contract = Address.newFromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqf8llllswuedva");

    const transaction = await controller.createTransactionForDelegating(alice, alice.getNonceThenIncrement(), {
        delegationContract: contract,
        amount: 5000000000000000000000n,
    });

    // sending the transaction
    const txHash = await entrypoint.sendTransaction(transaction);
}
```

#### Delegating funds to the contract using the factory
```js
{
    // create the entrypoint and the delegation factory
    const entrypoint = new DevnetEntrypoint();
    const factory = entrypoint.createDelegationTransactionsFactory();

    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const alice = await Account.newFromPem(filePath);

    const contract = Address.newFromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqf8llllswuedva");

    const transaction = await factory.createTransactionForDelegating(alice.address, {
        delegationContract: contract,
        amount: 5000000000000000000000n,
    });
    // fetch the nonce of the network
    alice.nonce = await entrypoint.recallAccountNonce(alice.address);

    // set the nonce
    transaction.nonce = alice.getNonceThenIncrement();

    // sign the transaction
    transaction.signature = await alice.signTransaction(transaction);

    // sending the transaction
    const txHash = await entrypoint.sendTransaction(transaction);
}
```

#### Redelegating rewards using the Controller
Over time, as rewards accumulate, we may choose to redelegate them to the contract to maximize earnings.

```js
{
    // create the entrypoint and the delegation controller
    const entrypoint = new DevnetEntrypoint();
    const controller = entrypoint.createDelegationController();

    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const alice = await Account.newFromPem(filePath);

    const contract = Address.newFromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqf8llllswuedva");
    // fetch the nonce of the network
    alice.nonce = await entrypoint.recallAccountNonce(alice.address);

    const transaction = await controller.createTransactionForRedelegatingRewards(
        alice,
        alice.getNonceThenIncrement(),
        {
            delegationContract: contract,
        },
    );

    // sending the transaction
    const txHash = await entrypoint.sendTransaction(transaction);
}
```

#### Redelegating rewards using the factory
```js
{
    // create the entrypoint and the delegation factory
    const entrypoint = new DevnetEntrypoint();
    const factory = entrypoint.createDelegationTransactionsFactory();

    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const alice = await Account.newFromPem(filePath);

    const contract = Address.newFromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqf8llllswuedva");

    const transaction = await factory.createTransactionForRedelegatingRewards(alice.address, {
        delegationContract: contract,
    });
    // fetch the nonce of the network
    alice.nonce = await entrypoint.recallAccountNonce(alice.address);

    // set the nonce
    transaction.nonce = alice.getNonceThenIncrement();

    // sign the transaction
    transaction.signature = await alice.signTransaction(transaction);

    // sending the transaction
    const txHash = await entrypoint.sendTransaction(transaction);
}
```

#### Claiming rewards using the Controller
We can also claim our rewards when needed.

```js
{
    // create the entrypoint and the delegation controller
    const entrypoint = new DevnetEntrypoint();
    const controller = entrypoint.createDelegationController();

    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const alice = await Account.newFromPem(filePath);

    const contract = Address.newFromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqf8llllswuedva");
    // fetch the nonce of the network
    alice.nonce = await entrypoint.recallAccountNonce(alice.address);

    const transaction = await controller.createTransactionForClaimingRewards(alice, alice.getNonceThenIncrement(), {
        delegationContract: contract,
    });

    // sending the transaction
    const txHash = await entrypoint.sendTransaction(transaction);
}
```

#### Claiming rewards using the factory
```js
{
    // create the entrypoint and the delegation factory
    const entrypoint = new DevnetEntrypoint();
    const factory = entrypoint.createDelegationTransactionsFactory();

    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const alice = await Account.newFromPem(filePath);

    const contract = Address.newFromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqf8llllswuedva");

    const transaction = await factory.createTransactionForClaimingRewards(alice.address, {
        delegationContract: contract,
    });
    // fetch the nonce of the network
    alice.nonce = await entrypoint.recallAccountNonce(alice.address);

    // set the nonce
    transaction.nonce = alice.getNonceThenIncrement();

    // sign the transaction
    transaction.signature = await alice.signTransaction(transaction);

    // sending the transaction
    const txHash = await entrypoint.sendTransaction(transaction);
}
```

#### Undelegating funds using the Controller
By **undelegating**, we signal the contract that we want to retrieve our staked funds. This process requires a **10-epoch unbonding period** before the funds become available.

```js
{
    // create the entrypoint and the delegation controller
    const entrypoint = new DevnetEntrypoint();
    const controller = entrypoint.createDelegationController();

    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const alice = await Account.newFromPem(filePath);

    const contract = Address.newFromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqf8llllswuedva");
    // fetch the nonce of the network
    alice.nonce = await entrypoint.recallAccountNonce(alice.address);

    const transaction = await controller.createTransactionForUndelegating(alice, alice.getNonceThenIncrement(), {
        delegationContract: contract,
        amount: 1000000000000000000000n, // 1000 EGLD
    });

    // sending the transaction
    const txHash = await entrypoint.sendTransaction(transaction);
}
```

#### Undelegating funds using the factory
```js
{
    // create the entrypoint and the delegation factory
    const entrypoint = new DevnetEntrypoint();
    const factory = entrypoint.createDelegationTransactionsFactory();

    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const alice = await Account.newFromPem(filePath);

    const contract = Address.newFromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqf8llllswuedva");

    const transaction = await factory.createTransactionForUndelegating(alice.address, {
        delegationContract: contract,
        amount: 1000000000000000000000n, // 1000 EGLD
    });
    // fetch the nonce of the network
    alice.nonce = await entrypoint.recallAccountNonce(alice.address);

    // set the nonce
    transaction.nonce = alice.getNonceThenIncrement();

    // sign the transaction
    transaction.signature = await alice.signTransaction(transaction);

    // sending the transaction
    const txHash = await entrypoint.sendTransaction(transaction);
}
```

#### Withdrawing funds using the Controller
After the `10-epoch unbonding period` is complete, we can proceed with withdrawing our staked funds using the controller. This final step allows us to regain access to the previously delegated funds.

```js
{
    // create the entrypoint and the delegation controller
    const entrypoint = new DevnetEntrypoint();
    const controller = entrypoint.createDelegationController();

    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const alice = await Account.newFromPem(filePath);

    const contract = Address.newFromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqf8llllswuedva");

    // fetch the nonce of the network
    alice.nonce = await entrypoint.recallAccountNonce(alice.address);

    const transaction = await controller.createTransactionForWithdrawing(alice, alice.getNonceThenIncrement(), {
        delegationContract: contract,
    });

    // sending the transaction
    const txHash = await entrypoint.sendTransaction(transaction);
}
```

#### Withdrawing funds using the factory
```js
{
    // create the entrypoint and the delegation factory
    const entrypoint = new DevnetEntrypoint();
    const factory = entrypoint.createDelegationTransactionsFactory();

    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const alice = await Account.newFromPem(filePath);

    const contract = Address.newFromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqf8llllswuedva");

    const transaction = await factory.createTransactionForWithdrawing(alice.address, {
        delegationContract: contract,
    });
    // fetch the nonce of the network
    alice.nonce = await entrypoint.recallAccountNonce(alice.address);

    // set the nonce
    transaction.nonce = alice.getNonceThenIncrement();

    // sign the transaction
    transaction.signature = await alice.signTransaction(transaction);

    // sending the transaction
    const txHash = await entrypoint.sendTransaction(transaction);
}
```

### Relayed transactions
We are currently on the `third iteration (V3)` of relayed transactions. V1 and V2 will soon be deactivated, so we will focus on V3.

For V3, two new fields have been added to transactions:
- relayer
- relayerSignature

Signing Process:
1. The relayer must be set before the sender signs the transaction.
2. Once the sender has signed, the relayer can also sign the transaction and broadcast it.

**Important Consideration**:
Relayed V3 transactions require an additional `50,000` gas.
Let’s see how to create a relayed transaction:

```js
{
    const entrypoint = new DevnetEntrypoint();
    const walletsPath = path.join("../src", "testdata", "testwallets");
    const bob = await Account.newFromPem(path.join(walletsPath, "bob.pem"));
    const grace = Address.newFromBech32("erd1r69gk66fmedhhcg24g2c5kn2f2a5k4kvpr6jfw67dn2lyydd8cfswy6ede");
    const mike = await Account.newFromPem(path.join(walletsPath, "mike.pem"));

    // fetch the nonce of the network
    bob.nonce = await entrypoint.recallAccountNonce(bob.address);

    const transaction = new Transaction({
        chainID: "D",
        sender: bob.address,
        receiver: grace,
        relayer: mike.address,
        gasLimit: 110_000n,
        data: Buffer.from("hello"),
        nonce: bob.getNonceThenIncrement(),
    });

    // sender signs the transaction
    transaction.signature = await bob.signTransaction(transaction);

    // relayer signs the transaction
    transaction.relayerSignature = await mike.signTransaction(transaction);

    // broadcast the transaction
    const txHash = await entrypoint.sendTransaction(transaction);
}
```

#### Creating relayed transactions using controllers
We can create relayed transactions using any of the available controllers.
Each controller includes a relayer argument, which must be set if we want to create a relayed transaction.

Let’s issue a fungible token using a relayed transaction:

```js
{
    // create the entrypoint and the token management controller
    const entrypoint = new DevnetEntrypoint();
    const controller = entrypoint.createTokenManagementController();

    // create the issuer of the token
    const walletsPath = path.join("../src", "testdata", "testwallets");
    const alice = await Account.newFromPem(path.join(walletsPath, "alice.pem"));

    // Carol will be our relayer, that means she is paying the gas for the transaction
    const frank = await Account.newFromPem(path.join(walletsPath, "frank.pem"));

    // fetch the nonce of the network
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
        relayer: frank.address,
    });

    // relayer also signs the transaction
    transaction.relayerSignature = await frank.signTransaction(transaction);

    // broadcast the transaction
    const txHash = await entrypoint.sendTransaction(transaction);
}
```

#### Creating relayed transactions using factories
Unlike controllers, `transaction factories` do not have a `relayer` argument. Instead, the **relayer must be set after creating the transaction**.
This approach is beneficial because the **transaction is not signed by the sender at the time of creation**, allowing flexibility in setting the relayer before signing.

Let’s issue a fungible token using the `TokenManagementTransactionsFactory`:

```js
{
    // create the entrypoint and the token management factory
    const entrypoint = new DevnetEntrypoint();
    const factory = entrypoint.createTokenManagementTransactionsFactory();

    // create the issuer of the token
    const walletsPath = path.join("../src", "testdata", "testwallets");
    const alice = await Account.newFromPem(path.join(walletsPath, "alice.pem"));

    // carol will be our relayer, that means she is paying the gas for the transaction
    const frank = await Account.newFromPem(path.join(walletsPath, "frank.pem"));

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

    // fetch the nonce of the network
    alice.nonce = await entrypoint.recallAccountNonce(alice.address);
    transaction.nonce = alice.getNonceThenIncrement();

    // set the relayer
    transaction.relayer = frank.address;

    // sign the transaction
    transaction.signature = await alice.signTransaction(transaction);

    // relayer also signs the transaction
    transaction.relayerSignature = await frank.signTransaction(transaction);

    // broadcast the transaction
    const txHash = await entrypoint.sendTransaction(transaction);
}
```

### Guarded transactions
Similar to relayers, transactions also have two additional fields:

- guardian
- guardianSignature

Each controller includes an argument for the guardian. The transaction can either:
1. Be sent to a service that signs it using the guardian’s account, or
2. Be signed by another account acting as a guardian.

Let’s issue a token using a guarded account:

#### Creating guarded transactions using controllers
We can create guarded transactions using any of the available controllers.

Each controller method includes a guardian argument, which must be set if we want to create a guarded transaction.
Let’s issue a fungible token using a relayed transaction:

```js
{
    // create the entrypoint and the token management controller
    const entrypoint = new DevnetEntrypoint();
    const controller = entrypoint.createTokenManagementController();

    // create the issuer of the token
    const walletsPath = path.join("../src", "testdata", "testwallets");
    const alice = await Account.newFromPem(path.join(walletsPath, "alice.pem"));

    // carol will be our guardian
    const carol = await Account.newFromPem(path.join(walletsPath, "carol.pem"));

    // fetch the nonce of the network
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
        guardian: carol.address,
    });

    // guardian also signs the transaction
    transaction.guardianSignature = await carol.signTransaction(transaction);

    // broadcast the transaction
    const txHash = await entrypoint.sendTransaction(transaction);
}
```

#### Creating guarded transactions using factories
Unlike controllers, `transaction factories` do not have a `guardian` argument. Instead, the **guardian must be set after creating the transaction**.
This approach is beneficial because the transaction is **not signed by the sender at the time of creation**, allowing flexibility in setting the guardian before signing.

Let’s issue a fungible token using the `TokenManagementTransactionsFactory`:

```js
{
    // create the entrypoint and the token management factory
    const entrypoint = new DevnetEntrypoint();
    const factory = entrypoint.createTokenManagementTransactionsFactory();

    // create the issuer of the token
    const walletsPath = path.join("../src", "testdata", "testwallets");
    const alice = await Account.newFromPem(path.join(walletsPath, "alice.pem"));

    // carol will be our guardian
    const carol = await Account.newFromPem(path.join(walletsPath, "carol.pem"));

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

    // fetch the nonce of the network
    alice.nonce = await entrypoint.recallAccountNonce(alice.address);
    transaction.nonce = alice.getNonceThenIncrement();

    // set the guardian
    transaction.guardian = carol.address;

    // sign the transaction
    transaction.signature = await alice.signTransaction(transaction);

    // guardian also signs the transaction
    transaction.guardianSignature = await carol.signTransaction(transaction);

    // broadcast the transaction
    const txHash = await entrypoint.sendTransaction(transaction);
}
```

We can create guarded relayed transactions just like we did before. However, keep in mind:

Only the sender can be guarded, the relayer cannot be guarded.

Flow for Creating Guarded Relayed Transactions:
- Using Controllers:
1. Set both guardian and relayer fields.
2. The transaction must be signed by both the guardian and the relayer.
- Using Factories:

1. Create the transaction.
2. Set both guardian and relayer fields.
3. First, the sender signs the transaction.
4. Then, the guardian signs.
5. Finally, the relayer signs before broadcasting.

## Addresses

Create an `Address` object from a bech32-encoded string:

``` js
{
    // Create an Address object from a bech32-encoded string
    const address = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");

    console.log("Address (bech32-encoded):", address.toBech32());
    console.log("Public key (hex-encoded):", address.toHex());
    console.log("Public key (hex-encoded):", Buffer.from(address.getPublicKey()).toString("hex"));
}

```

Here’s how you can create an address from a hex-encoded string using the MultiversX JavaScript SDK:
If the HRP (human-readable part) is not provided, the SDK will use the default one ("erd").

``` js
{
    // Create an address from a hex-encoded string with a specified HRP
    const address = Address.newFromHex("0139472eff6886771a982f3083da5d421f24c29181e63888228dc81ca60d69e1", "erd");

    console.log("Address (bech32-encoded):", address.toBech32());
    console.log("Public key (hex-encoded):", address.toHex());
}
```

#### Create an address from a raw public key

``` js
{
    const pubkey = Buffer.from("0139472eff6886771a982f3083da5d421f24c29181e63888228dc81ca60d69e1", "hex");
    const addressFromPubkey = new Address(pubkey, "erd");
}
```

#### Getting the shard of an address
``` js

const addressComputer = new AddressComputer();
const address = Address.newFromHex("0139472eff6886771a982f3083da5d421f24c29181e63888228dc81ca60d69e1");
console.log("Shard:", addressComputer.getShardOfAddress(address));
```

Checking if an address is a smart contract
``` js

const contractAddress = Address.newFromBech32("erd1qqqqqqqqqqqqqpgquzmh78klkqwt0p4rjys0qtp3la07gz4d396qn50nnm");
console.log("Is contract address:", contractAddress.isSmartContract());
```

### Changing the default hrp
The **LibraryConfig** class manages the default **HRP** (human-readable part) for addresses, which is set to `"erd"` by default.
You can change the HRP when creating an address or modify it globally in **LibraryConfig**, affecting all newly created addresses.
``` js

console.log(LibraryConfig.DefaultAddressHrp);
const defaultAddress = Address.newFromHex("0139472eff6886771a982f3083da5d421f24c29181e63888228dc81ca60d69e1");
console.log(defaultAddress.toBech32());

LibraryConfig.DefaultAddressHrp = "test";
const testAddress = Address.newFromHex("0139472eff6886771a982f3083da5d421f24c29181e63888228dc81ca60d69e1");
console.log(testAddress.toBech32());

// Reset HRP back to "erd" to avoid affecting other parts of the application.
LibraryConfig.DefaultAddressHrp = "erd";
```

## Wallets

#### Generating a mnemonic
Mnemonic generation is based on [bip39](https://www.npmjs.com/package/bip39) and can be achieved as follows:

``` js

const mnemonic = Mnemonic.generate();
const words = mnemonic.getWords();
```

#### Saving the mnemonic to a keystore file
The mnemonic can be saved to a keystore file:

``` js
{
    const mnemonic = Mnemonic.generate();

    // saves the mnemonic to a keystore file with kind=mnemonic
    const wallet = UserWallet.fromMnemonic({ mnemonic: mnemonic.toString(), password: "password" });

    const filePath = path.join("../src", "testdata", "testwallets", "walletWithMnemonic.json");
    wallet.save(filePath);
}
```

#### Deriving secret keys from a mnemonic
Given a mnemonic, we can derive keypairs:

``` js
{
    const mnemonic = Mnemonic.generate();

    const secretKey = mnemonic.deriveKey(0);
    const publicKey = secretKey.generatePublicKey();

    console.log("Secret key: ", secretKey.hex());
    console.log("Public key: ", publicKey.hex());
}
```

#### Saving a secret key to a keystore file
The secret key can also be saved to a keystore file:

``` js
{
    const mnemonic = Mnemonic.generate();
    const secretKey = mnemonic.deriveKey();

    const wallet = UserWallet.fromSecretKey({ secretKey: secretKey, password: "password" });

    const filePath = path.join("../src", "testdata", "testwallets", "walletWithSecretKey.json");
    wallet.save(filePath);
}
```

#### Saving a secret key to a PEM file
We can save a secret key to a pem file. *This is not recommended as it is not secure, but it's very convenient for testing purposes.*

``` js
{
    const mnemonic = Mnemonic.generate();

    // by default, derives using the index = 0
    const secretKey = mnemonic.deriveKey();
    const publicKey = secretKey.generatePublicKey();

    const label = publicKey.toAddress().toBech32();
    const pem = new UserPem(label, secretKey);

    const filePath = path.join("../src", "testdata", "testwallets", "wallet.pem");
    pem.save(filePath);
}
```

#### Generating a KeyPair
A `KeyPair` is a wrapper over a secret key and a public key. We can create a keypair and use it for signing or verifying.

``` js
{
    const keypair = KeyPair.generate();

    // by default, derives using the index = 0
    const secretKey = keypair.getSecretKey();
    const publicKey = keypair.getPublicKey();
}
```

#### Loading a wallet from keystore mnemonic file
Load a keystore that holds an encrypted mnemonic (and perform wallet derivation at the same time):

``` js
{
    const filePath = path.join("../src", "testdata", "testwallets", "walletWithMnemonic.json");

    // loads the mnemonic and derives the a secret key; default index = 0
    let secretKey = UserWallet.loadSecretKey(filePath, "password");
    let address = secretKey.generatePublicKey().toAddress("erd");

    console.log("Secret key: ", secretKey.hex());
    console.log("Address: ", address.toBech32());

    // derive secret key with index = 7
    secretKey = UserWallet.loadSecretKey(filePath, "password", 7);
    address = secretKey.generatePublicKey().toAddress();

    console.log("Secret key: ", secretKey.hex());
    console.log("Address: ", address.toBech32());
}
```

#### Loading a wallet from a keystore secret key file

``` js
{
    const filePath = path.join("../src", "testdata", "testwallets", "walletWithSecretKey.json");

    let secretKey = UserWallet.loadSecretKey(filePath, "password");
    let address = secretKey.generatePublicKey().toAddress("erd");

    console.log("Secret key: ", secretKey.hex());
    console.log("Address: ", address.toBech32());
}
```

#### Loading a wallet from a PEM file

``` js
{
    const filePath = path.join("../src", "testdata", "testwallets", "wallet.pem");

    let pem = UserPem.fromFile(filePath);

    console.log("Secret key: ", pem.secretKey.hex());
    console.log("Public key: ", pem.publicKey.hex());
}
```

## Signing objects

Signing is done using an account's secret key. To simplify this process, we provide wrappers like [Account](#creating-accounts), which streamline signing operations.
First, we'll explore how to sign using an Account, followed by signing directly with a secret key.

#### Signing a Transaction using an Account
We are going to assume we have an account at this point. If you don't, feel free to check out the [creating an account](#creating-accounts) section.
```js
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
```

#### Signing a Transaction using a SecretKey
```js
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

    // serialize the transaction
    const transactionComputer = new TransactionComputer();
    const serializedTransaction = transactionComputer.computeBytesForSigning(transaction);

    // apply the signature on the transaction
    transaction.signature = await secretKey.sign(serializedTransaction);

    console.log(transaction.toPlainObject());
}
```

#### Signing a Transaction by hash
```js
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

    // sets the least significant bit of the options field to `1`
    transactionComputer.applyOptionsForHashSigning(transaction);

    // compute a keccak256 hash for signing
    const hash = transactionComputer.computeHashForSigning(transaction);

    // sign and apply the signature on the transaction
    transaction.signature = await alice.signTransaction(transaction);

    console.log(transaction.toPlainObject());
}
```

#### Signing a Message using an Account:
```js
{
    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const alice = await Account.newFromPem(filePath);

    const message = new Message({
        data: new Uint8Array(Buffer.from("hello")),
        address: alice.address,
    });

    message.signature = await alice.signMessage(message);
}
```

#### Signing a Message using an SecretKey:
```js
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
```

## Verifying signatures

Signature verification is performed using an account’s public key.
To simplify this process, we provide wrappers over public keys that make verification easier and more convenient.

#### Verifying Transaction signature using a UserVerifier
```js
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

    // sign and apply the signature on the transaction
    transaction.signature = await account.signTransaction(transaction);

    // instantiating a user verifier; basically gets the public key
    const alice = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
    const aliceVerifier = UserVerifier.fromAddress(alice);

    // serialize the transaction for verification
    const transactionComputer = new TransactionComputer();
    const serializedTransaction = transactionComputer.computeBytesForVerifying(transaction);

    // verify the signature
    const isSignedByAlice = aliceVerifier.verify(serializedTransaction, transaction.signature);

    console.log("Transaction is signed by Alice: ", isSignedByAlice);
}
```

#### Verifying Message signature using a UserVerifier

```ts
{
    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const account = await Account.newFromPem(filePath);

    const message = new Message({
        data: new Uint8Array(Buffer.from("hello")),
        address: account.address,
    });

    // sign and apply the signature on the message
    message.signature = await account.signMessage(message);

    // instantiating a user verifier; basically gets the public key
    const alice = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
    const aliceVerifier = UserVerifier.fromAddress(alice);

    // serialize the message for verification
    const messageComputer = new MessageComputer();
    const serializedMessage = messageComputer.computeBytesForVerifying(message);

    // verify the signature
    const isSignedByAlice = await aliceVerifier.verify(serializedMessage, message.signature);

    console.log("Message is signed by Alice: ", isSignedByAlice);
}
```

#### Verifying a signature using a public key
```js
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

    // sign and apply the signature on the transaction
    transaction.signature = await account.signTransaction(transaction);

    // instantiating a public key
    const alice = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
    const publicKey = new UserPublicKey(alice.getPublicKey());

    // serialize the transaction for verification
    const transactionComputer = new TransactionComputer();
    const serializedTransaction = transactionComputer.computeBytesForVerifying(transaction);

    // verify the signature
    const isSignedByAlice = await publicKey.verify(serializedTransaction, transaction.signature);
    console.log("Transaction is signed by Alice: ", isSignedByAlice);
}
```

#### Sending messages over boundaries
Signed Message objects are typically sent to a remote party (e.g., a service), which can then verify the signature.
To prepare a message for transmission, you can use the `MessageComputer.packMessage()` utility method.

```js
{
    const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
    const account = await Account.newFromPem(filePath);

    const message = new Message({
        data: new Uint8Array(Buffer.from("hello")),
        address: account.address,
    });

    // sign and apply the signature on the message
    message.signature = await account.signMessage(message);

    const messageComputer = new MessageComputer();
    const packedMessage = messageComputer.packMessage(message);

    console.log("Packed message", packedMessage);
}
```

Then, on the receiving side, you can use [`MessageComputer.unpackMessage()`](https://multiversx.github.io/mx-sdk-js-core/v13/classes/MessageComputer.html#unpackMessage) to reconstruct the message, prior verification:

```js
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
    // restore message

    const packedMessage = messageComputer.packMessage(message);
    const unpackedMessage = messageComputer.unpackMessage(packedMessage);

    // verify the signature
    const isSignedByAlice = await alice.verifyMessageSignature(unpackedMessage, message.signature);

    console.log("Transaction is signed by Alice: ", isSignedByAlice);
}
```
