import {
    Address,
    ApiNetworkProvider,
    DevnetEntrypoint,
    ProxyNetworkProvider,
    SmartContractQuery,
    Token,
    Transaction,
} from "../src"; // md-ignore
// md-start
(async () => {
    // ## Calling the Faucet

    // This functionality is not yet available through the entrypoint, but we recommend using the faucet available within the Web Wallet. For more details about the faucet [see this](https://docs.multiversx.com/wallet/web-wallet/#testnet-and-devnet-faucet).

    // - [Testnet Wallet](https://testnet-wallet.multiversx.com/).
    // - [Devnet Wallet](https://devnet-wallet.multiversx.com/).

    // ### Interacting with the network

    // The entrypoint exposes a few ways to directly interact with the network, such as:

    // - `recallAccountNonce(address: Address): Promise<bigint>;`
    // - `sendTransactions(transactions: Transaction[]): Promise<[number, string[]]>;`
    // - `sendTransaction(transaction: Transaction): Promise<string>;`
    // - `getTransaction(txHash: string): Promise<TransactionOnNetwork>;`
    // - `awaitCompletedTransaction(txHash: string): Promise<TransactionOnNetwork>;`

    // Some other methods are exposed through a so called **network provider**.

    // - **ApiNetworkProvider**: Interacts with the API, which is a layer over the proxy. It fetches data from the network and `Elastic Search`.
    // - **ProxyNetworkProvider**: Interacts directly with the proxy of an observing squad.

    // To get the underlying network provider from our entrypoint, we can do as follows:

    // ```js
    {
        const entrypoint = new DevnetEntrypoint();
        const networkProvider = entrypoint.createNetworkProvider();
    }
    // ```

    // ### Creating a network provider
    // When manually instantiating a network provider, you can provide a configuration to specify the client name and set custom request options.

    // ```js
    {
        // Create a configuration object
        const config = {
            clientName: "hello-multiversx",
            requestsOptions: {
                timeout: 1000, // Timeout in milliseconds // md-as-comment
                auth: {
                    username: "user",
                    password: "password",
                },
            },
        };

        // Instantiate the network provider with the config
        const api = new ApiNetworkProvider("https://devnet-api.multiversx.com", config);
    }
    // ```

    // A full list of available methods for `ApiNetworkProvider` can be found [here](https://multiversx.github.io/mx-sdk-js-core/v14/classes/ApiNetworkProvider.html).

    // Both `ApiNetworkProvider` and `ProxyNetworkProvider` implement a common interface, which can be found [here](https://multiversx.github.io/mx-sdk-js-core/v14/interfaces/INetworkProvider.html). This allows them to be used interchangeably.

    // The classes returned by the API expose the most commonly used fields directly for convenience. However, each object also contains a `raw` field that stores the original API response, allowing access to additional fields if needed.

    // ## Fetching data from the network

    // ### Fetching the network config

    // ```js
    {
        const entrypoint = new DevnetEntrypoint();
        const networkProvider = entrypoint.createNetworkProvider();

        const networkConfig = networkProvider.getNetworkConfig();
    }
    // ```

    // ### Fetching the network status

    // ```js
    {
        const entrypoint = new DevnetEntrypoint();
        const networkProvider = entrypoint.createNetworkProvider();

        const metaNetworkStatus = networkProvider.getNetworkStatus(); // fetches status from metachain // md-as-comment
        const networkStatus = networkProvider.getNetworkStatus(); // fetches status from shard one // md-as-comment
    }
    // ```

    // ### Fetching a Block from the Network
    // To fetch a block, we first instantiate the required arguments and use its hash. The API only supports fetching blocks by hash, whereas the **PROXY** allows fetching blocks by either hash or nonce.

    // When using the **PROXY**, keep in mind that the shard must also be specified in the arguments.

    // #### Fetching a block using the **API**
    // ```js
    {
        const api = new ApiNetworkProvider("https://devnet-api.multiversx.com");
        const blockHash = "1147e111ce8dd860ae43a0f0d403da193a940bfd30b7d7f600701dd5e02f347a";
        const block = await api.getBlock(blockHash);
    }
    // ```

    // Additionally, we can fetch the latest block from the network:

    // ```js
    {
        const api = new ApiNetworkProvider("https://devnet-api.multiversx.com");
        const latestBlock = await api.getLatestBlock();
    }
    // ```

    // #### Fetching a block using the **PROXY**

    // When using the proxy, we have to provide the shard, as well.
    // ```js
    {
        const proxy = new ProxyNetworkProvider("https://devnet-api.multiversx.com");
        const blockHash = "1147e111ce8dd860ae43a0f0d403da193a940bfd30b7d7f600701dd5e02f347a";
        const block = proxy.getBlock({ blockHash, shard: 1 });
    }
    // ```

    // We can also fetch the latest block from the network.
    // By default, the shard will be the metachain, but we can specify a different shard if needed.

    // ```js
    {
        const proxy = new ProxyNetworkProvider("https://devnet-api.multiversx.com");
        const latestBlock = proxy.getLatestBlock();
    }
    // ```

    // ### Fetching an Account
    // To fetch an account, we need its address. Once we have the address, we create an `Address` object and pass it as an argument to the method.

    // ```js
    {
        const entrypoint = new DevnetEntrypoint();
        const api = entrypoint.createNetworkProvider();
        const alice = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const account = await api.getAccount(alice);
    }
    // ```

    // ### Fetching an Account's Storage
    // We can also fetch an account's storage, allowing us to retrieve all key-value pairs saved for that account.

    // ```js
    {
        const entrypoint = new DevnetEntrypoint();
        const api = entrypoint.createNetworkProvider();
        const alice = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const account = await api.getAccountStorage(alice);
    }
    // ```

    // If we only want to fetch a specific key, we can do so as follows:

    // ```js
    {
        const entrypoint = new DevnetEntrypoint();
        const api = entrypoint.createNetworkProvider();
        const alice = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const account = await api.getAccountStorageEntry(alice, "testKey");
    }
    // ```

    // ### Waiting for an Account to Meet a Condition
    // There are times when we need to wait for a specific condition to be met before proceeding with an action.
    // For example, let's say we want to send 7 EGLD from Alice to Bob, but this can only happen once Alice's balance reaches at least 7 EGLD.
    // This approach is useful in scenarios where you're waiting for external funds to be sent to Alice, enabling her to transfer the required amount to another recipient.

    // To implement this, we need to define the condition to check each time the account is fetched from the network. We create a function that takes an `AccountOnNetwork` object as an argument and returns a `bool`.
    // Keep in mind that this method has a default timeout, which can be adjusted using the `AwaitingOptions` class.

    // ```js
    {
        const entrypoint = new DevnetEntrypoint();
        const api = entrypoint.createNetworkProvider();

        const condition = (account: any) => {
            return account.balance >= 7000000000000000000n; // 7 EGLD // md-as-comment
        };
        const alice = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const account = await api.awaitAccountOnCondition(alice, condition);
    }
    // ```

    // ### Sending and Simulating Transactions
    // To execute transactions, we use the network providers to broadcast them to the network. Keep in mind that for transactions to be processed, they must be signed.

    // #### Sending a Transaction

    // ```js
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
    // ```

    // #### Sending multiple transactions
    // ```js
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
    // ```

    // #### Simulating transactions
    // A transaction can be simulated before being sent for processing by the network. This is primarily used for smart contract calls, allowing you to preview the results produced by the smart contract.

    // ```js
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
    // ```

    // #### Estimating the gas cost of a transaction
    // Before sending a transaction to the network for processing, you can retrieve the estimated gas limit required for the transaction to be executed.

    // ```js
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
    // ```

    // ### Waiting for transaction completion
    // After sending a transaction, you may want to wait until it is processed before proceeding with another action. Keep in mind that this method has a default timeout, which can be adjusted using the `AwaitingOptions` class.

    // ```js
    {
        const entrypoint = new DevnetEntrypoint();
        const api = entrypoint.createNetworkProvider();

        const txHash = "exampletransactionhash";
        const transactionOnNetwork = await api.awaitTransactionCompleted(txHash);
    }
    // ```

    // ### Waiting for a Transaction to Satisfy a Condition
    // Similar to accounts, we can wait until a transaction meets a specific condition.

    // ```js
    {
        const entrypoint = new DevnetEntrypoint();
        const api = entrypoint.createNetworkProvider();

        const condition = (txOnNetwork: any) => !txOnNetwork.status.isSuccessful();

        const txHash = "exampletransactionhash";
        const transactionOnNetwork = await api.awaitTransactionOnCondition(txHash, condition);
    }
    // ```

    // ### Waiting for transaction completion
    // After sending a transaction, you may want to wait until it is processed before proceeding with another action. Keep in mind that this method has a default timeout, which can be adjusted using the `AwaitingOptions` class.

    // ```js
    {
        const entrypoint = new DevnetEntrypoint();
        const api = entrypoint.createNetworkProvider();

        const txHash = "exampletransactionhash";
        const transactionOnNetwork = await api.awaitTransactionCompleted(txHash);
    }
    // ```

    // ### Fetching Transactions from the Network
    // After sending a transaction, we can fetch it from the network using the transaction hash, which we receive after broadcasting the transaction.

    // ```js
    {
        const entrypoint = new DevnetEntrypoint();
        const api = entrypoint.createNetworkProvider();

        const txHash = "exampletransactionhash";
        const transactionOnNetwork = await api.getTransaction(txHash);
    }
    // ```

    // ### Fetching a token from an account
    // We can fetch a specific token (ESDT, MetaESDT, SFT, NFT) from an account by providing the account's address and the token identifier.

    // ```js
    {
        const entrypoint = new DevnetEntrypoint();
        const api = entrypoint.createNetworkProvider();

        const alice = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        let token = new Token({ identifier: "TEST-ff155e" }); // ESDT // md-as-comment
        let tokenOnNetwork = await api.getTokenOfAccount(alice, token);

        token = new Token({ identifier: "NFT-987654", nonce: 11n }); // NFT // md-as-comment
        tokenOnNetwork = await api.getTokenOfAccount(alice, token);
    }
    // ```

    // ### Fetching all fungible tokens of an account
    // Fetches all fungible tokens held by an account. Note that this method does not handle pagination, but it can be achieved using `doGetGeneric`.

    // ```js
    {
        const entrypoint = new DevnetEntrypoint();
        const api = entrypoint.createNetworkProvider();

        const alice = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const fungibleTokens = await api.getFungibleTokensOfAccount(alice);
    }
    // ```

    // ### Fetching all non-fungible tokens of an account
    // Fetches all non-fungible tokens held by an account. Note that this method does not handle pagination, but it can be achieved using `doGetGeneric`.

    // ```js
    {
        const entrypoint = new DevnetEntrypoint();
        const api = entrypoint.createNetworkProvider();

        const alice = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const nfts = await api.getNonFungibleTokensOfAccount(alice);
    }
    // ```

    // ### Fetching token metadata
    // If we want to fetch the metadata of a token (e.g., owner, decimals, etc.), we can use the following methods:

    // ```js
    {
        const entrypoint = new DevnetEntrypoint();
        const api = entrypoint.createNetworkProvider();

        // used for ESDT // md-as-comment
        const fungibleTokenDefinition = await api.getDefinitionOfFungibleToken("TEST-ff155e");

        // used for METAESDT, SFT, NFT // md-as-comment
        const nonFungibleTokenDefinition = await api.getDefinitionOfTokenCollection("NFTEST-ec88b8");
    }
    // ```

    // ### Querying Smart Contracts
    // Smart contract queries, or view functions, are endpoints that only read data from the contract. To send a query to the observer nodes, we can proceed as follows:

    // ```js
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
    // ```

    // ### Custom Api/Proxy calls
    // The methods exposed by the `ApiNetworkProvider` or `ProxyNetworkProvider` are the most common and widely used. However, there may be times when custom API calls are needed. For these cases, we’ve created generic methods for both GET and POST requests.
    // Let’s assume we want to retrieve all the transactions sent by Alice in which the `delegate` function was called.

    // ```js
    {
        const entrypoint = new DevnetEntrypoint();
        const api = entrypoint.createNetworkProvider();

        const alice = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const url = `transactions/${alice.toBech32()}?function=delegate`;

        const response = await api.doGetGeneric(url);
    }
    // ```
})().catch((e) => {
    console.log({ e });
});
