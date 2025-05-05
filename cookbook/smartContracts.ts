import axios from "axios"; // md-ignore
import { promises } from "fs"; // md-ignore
import path from "path"; // md-ignore
import {
    Abi,
    Account,
    Address,
    AddressComputer,
    BigUIntValue,
    BinaryCodec,
    DevnetEntrypoint,
    Field,
    gatherAllEvents,
    SmartContractTransactionsOutcomeParser,
    Struct,
    Token,
    TokenIdentifierValue,
    TokenTransfer,
    TransactionEventsParser,
    U32Value,
    U64Value,
} from "../src"; // md-ignore
import { loadAbiRegistry } from "../src/testutils";
// md-start
(async () => {
    // ### Smart Contracts

    // #### Contract ABIs

    // A contract's ABI (Application Binary Interface) describes the endpoints, data structures, and events that the contract exposes.
    // While interactions with the contract are possible without the ABI, they are much easier to implement when the definitions are available.

    // #### Loading the ABI from a file
    // ```js
    {
        let abiJson = await promises.readFile("../src/testData/adder.abi.json", { encoding: "utf8" });
        let abiObj = JSON.parse(abiJson);
        let abi = Abi.create(abiObj);
    }
    // ```

    // #### Loading the ABI from an URL

    // ```js
    {
        const response = await axios.get(
            "https://github.com/multiversx/mx-sdk-js-core/raw/main/src/testdata/adder.abi.json",
        );
        let abi = Abi.create(response.data);
    }
    // ```

    // #### Manually construct the ABI

    // If an ABI file isn’t available, but you know the contract’s endpoints and data types, you can manually construct the ABI.

    // ```js
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
    // ```

    // ```js
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
    // ```

    // ### Smart Contract deployments
    // For creating smart contract deployment transactions, we have two options: a controller and a factory. Both function similarly to the ones used for token transfers.
    // When creating transactions that interact with smart contracts, it's recommended to provide the ABI file to the controller or factory if possible.
    // This allows arguments to be passed as native Javascript values. If the ABI is not available, but we know the expected data types, we can pass arguments as typed values (e.g., `BigUIntValue`, `ListValue`, `StructValue`, etc.) or as raw bytes.

    // #### Deploying a Smart Contract Using the Controller

    // ```js
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

        // For deploy arguments, use "TypedValue" objects if you haven't provided an ABI to the factory: // md-as-comment
        let args: any[] = [new U32Value(42)];
        // Or use simple, plain JavaScript values and objects if you have provided an ABI to the factory: // md-as-comment
        args = [42];

        const deployTransaction = await controller.createTransactionForDeploy(sender, sender.getNonceThenIncrement(), {
            bytecode: bytecode,
            gasLimit: 6000000n,
            arguments: args,
        });

        // broadcasting the transaction
        const txHash = await entrypoint.sendTransaction(deployTransaction);
    }
    // ```

    // :::tip
    // When creating transactions using `class:SmartContractController` or `class:SmartContractTransactionsFactory`, even if the ABI is available and provided,
    // you can still use `class:TypedValue` objects as arguments for deployments and interactions.

    //  Even further, you can use a mix of `class:TypedValue` objects and plain JavaScript values and objects. For example:

    // ```js
    // let args = [new U32Value(42), "hello", { foo: "bar" }, new TokenIdentifierValue("TEST-abcdef")];
    // ```
    // :::

    // #### Parsing contract deployment transactions

    // ```js
    {
        // We use the transaction hash we got when broadcasting the transaction

        const abi = await loadAbiRegistry("../src/testdata/adder.abi.json");
        const entrypoint = new DevnetEntrypoint();
        const controller = entrypoint.createSmartContractController(abi);
        const outcome = await controller.awaitCompletedDeploy("txHash"); // waits for transaction completion and parses the result
        const contractAddress = outcome.contracts[0].address;
    }
    // ```

    // If we want to wait for transaction completion and parse the result in two different steps, we can do as follows:

    // ```js
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
    // ```

    // #### Computing the contract address

    // Even before broadcasting, at the moment you know the sender's address and the nonce for your deployment transaction, you can (deterministically) compute the (upcoming) address of the smart contract:

    // ```js
    {
        const entrypoint = new DevnetEntrypoint();
        const factory = entrypoint.createSmartContractTransactionsFactory();
        const bytecode = await promises.readFile("../contracts/adder.wasm");

        // For deploy arguments, use "TypedValue" objects if you haven't provided an ABI to the factory: // md-as-comment
        let args: any[] = [new BigUIntValue(42)];
        // Or use simple, plain JavaScript values and objects if you have provided an ABI to the factory: // md-as-comment
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
    // ```

    // #### Deploying a Smart Contract using the factory
    // After the transaction is created the nonce needs to be properly set and the transaction should be signed before broadcasting it.

    // ```js
    {
        const entrypoint = new DevnetEntrypoint();
        const factory = entrypoint.createSmartContractTransactionsFactory();

        // load the contract bytecode
        const bytecode = await promises.readFile("../src/testData/adder.wasm");

        // For deploy arguments, use "TypedValue" objects if you haven't provided an ABI to the factory: // md-as-comment
        let args: any[] = [new BigUIntValue(42)];
        // Or use simple, plain JavaScript values and objects if you have provided an ABI to the factory: // md-as-comment
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
    // ```

    // ### Smart Contract calls

    // In this section we'll see how we can call an endpoint of our previously deployed smart contract using both approaches with the `controller` and the `factory`.

    // #### Calling a smart contract using the controller

    // ```js
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

        // For deploy arguments, use "TypedValue" objects if you haven't provided an ABI to the factory: // md-as-comment
        let args: any[] = [new U32Value(42)];
        // Or use simple, plain JavaScript values and objects if you have provided an ABI to the factory: // md-as-comment
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
    // ```

    // #### Parsing smart contract call transactions
    // In our case, calling the add endpoint does not return anything, but similar to the example above, we could parse this transaction to get the output values of a smart contract call.

    // ```js
    {
        const entrypoint = new DevnetEntrypoint();
        const controller = entrypoint.createSmartContractController();
        const txHash = "b3ae88ad05c464a74db73f4013de05abcfcb4fb6647c67a262a6cfdf330ef4a9";
        // waits for transaction completion and parses the result
        const parsedOutcome = await controller.awaitCompletedExecute(txHash);
        const values = parsedOutcome.values;
    }
    // ```

    // #### Calling a smart contract and sending tokens (transfer & execute)
    // Additionally, if an endpoint requires a payment when called, we can send tokens to the contract while creating a smart contract call transaction.
    // Both EGLD and ESDT tokens or a combination of both can be sent. This functionality is supported by both the controller and the factory.

    // ```js
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

        // For deploy arguments, use "TypedValue" objects if you haven't provided an ABI to the factory: // md-as-comment
        let args: any[] = [new U32Value(42)];
        // Or use simple, plain JavaScript values and objects if you have provided an ABI to the factory: // md-as-comment
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
    // ```

    // #### Calling a smart contract using the factory
    // Let's create the same smart contract call transaction, but using the `factory`.

    // ```js
    {
        const filePath = path.join("../src", "testdata", "testwallets", "alice.pem");
        const alice = await Account.newFromPem(filePath);
        const entrypoint = new DevnetEntrypoint();

        // the developer is responsible for managing the nonce
        alice.nonce = await entrypoint.recallAccountNonce(alice.address);

        // get the smart contracts controller
        const controller = entrypoint.createSmartContractTransactionsFactory();

        const contractAddress = Address.newFromBech32("erd1qqqqqqqqqqqqqpgq7cmfueefdqkjsnnjnwydw902v8pwjqy3d8ssd4meug");

        // For deploy arguments, use "TypedValue" objects if you haven't provided an ABI to the factory: // md-as-comment
        let args: any[] = [new U32Value(42)];
        // Or use simple, plain JavaScript values and objects if you have provided an ABI to the factory: // md-as-comment
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
    // ```

    // #### Parsing transaction outcome
    // As said before, the `add` endpoint we called does not return anything, but we could parse the outcome of smart contract call transactions, as follows:

    // ```js
    {
        // load the abi file
        const entrypoint = new DevnetEntrypoint();
        const abi = await loadAbiRegistry("../src/testdata/adder.abi.json");
        const parser = new SmartContractTransactionsOutcomeParser({ abi });
        const txHash = "b3ae88ad05c464a74db73f4013de05abcfcb4fb6647c67a262a6cfdf330ef4a9";
        const transactionOnNetwork = await entrypoint.getTransaction(txHash);
        const outcome = parser.parseExecute({ transactionOnNetwork });
    }
    // ```

    // #### Decoding transaction events
    // You might be interested into decoding events emitted by a contract. You can do so by using the `TransactionEventsParser`.

    // Suppose we'd like to decode a `startPerformAction` event emitted by the [multisig](https://github.com/multiversx/mx-contracts-rs/tree/main/contracts/multisig) contract.

    // First, we load the abi file, then we fetch the transaction, we extract the event from the transaction and then we parse it.

    // ```js
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
    // ```

    // #### Decoding transaction events
    // Whenever needed, the contract ABI can be used for manually encoding or decoding custom types.

    // Let's encode a struct called EsdtTokenPayment (of [multisig](https://github.com/multiversx/mx-contracts-rs/tree/main/contracts/multisig) contract) into binary data.
    // ```js
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
    // ```

    // Now let's decode a struct using the ABI.
    // ```js
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
    // ```

    // ### Smart Contract queries
    // When querying a smart contract, a **view function** is called. A view function does not modify the state of the contract, so we do not need to send a transaction.
    // To perform this query, we use the **SmartContractController**. While we can use the contract's ABI file to encode the query arguments, we can also use it to parse the result.
    // In this example, we will query the **adder smart contract** by calling its `getSum` endpoint.

    // ```js
    {
        const entrypoint = new DevnetEntrypoint();
        const contractAddress = Address.newFromBech32("erd1qqqqqqqqqqqqqpgq7cmfueefdqkjsnnjnwydw902v8pwjqy3d8ssd4meug");
        const abi = await loadAbiRegistry("../src/testdata/adder.abi.json");

        // create the controller
        const controller = entrypoint.createSmartContractController(abi);

        // creates the query, runs the query, parses the result
        const response = await controller.query({ contract: contractAddress, function: "getSum", arguments: [] });
    }
    // ```

    // If we need more granular control, we can split the process into three steps: **create the query, run the query, and parse the query response**.
    // This approach achieves the same result as the previous example.

    // ```js
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
    // ```

    // ### Upgrading a smart contract
    // Contract upgrade transactions are similar to deployment transactions (see above) because they also require contract bytecode.
    // However, in this case, the contract address is already known. Like deploying a smart contract, we can upgrade a smart contract using either the **controller** or the **factory**.

    // #### Uprgrading a smart contract using the controller
    // ```js
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

        // For deploy arguments, use "TypedValue" objects if you haven't provided an ABI to the factory: // md-as-comment
        let args: any[] = [new U32Value(42)];
        // Or use simple, plain JavaScript values and objects if you have provided an ABI to the factory: // md-as-comment
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
    // ```
})().catch((e) => {
    console.log({ e });
});
