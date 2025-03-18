import BigNumber from "bignumber.js";
import { assert } from "chai";
import { Account } from "../accounts";
import { Address } from "../core/address";
import { SmartContractQueryResponse } from "../core/smartContractQuery";
import { Token, TokenTransfer } from "../core/tokens";
import { Transaction } from "../core/transaction";
import { SmartContractController } from "../smartContracts";
import { loadAbiRegistry, MockNetworkProvider } from "../testutils";
import { getTestWalletsPath } from "../testutils/utils";
import { ContractFunction } from "./function";
import { Interaction } from "./interaction";
import { SmartContract } from "./smartContract";
import { BigUIntValue, BytesValue, OptionalValue, OptionValue, TokenIdentifierValue, U32Value } from "./typesystem";

describe("test smart contract interactor", function () {
    let dummyAddress = new Address("erd1qqqqqqqqqqqqqpgqak8zt22wl2ph4tswtyc39namqx6ysa2sd8ss4xmlj3");
    let provider = new MockNetworkProvider();
    let alice: Account;

    before(async function () {
        alice = await Account.newFromPem(`${getTestWalletsPath()}/alice.pem`);
    });

    it("should set transaction fields", async function () {
        let contract = new SmartContract({ address: dummyAddress });
        let dummyFunction = new ContractFunction("dummy");
        let interaction = new Interaction(contract, dummyFunction, []);

        let transaction = interaction
            .withSender(alice.address)
            .withNonce(7n)
            .withValue(TokenTransfer.newFromNativeAmount(1000000000000000000n).amount)
            .withGasLimit(20000000n)
            .buildTransaction();

        assert.deepEqual(transaction.receiver, dummyAddress);
        assert.equal(transaction.value.toString(), "1000000000000000000");
        assert.equal(transaction.nonce, 7n);
        assert.equal(transaction.gasLimit, 20000000n);
    });

    it("should set transfers (payments) on contract calls (transfer and execute)", async function () {
        let contract = new SmartContract({ address: dummyAddress });
        let dummyFunction = new ContractFunction("dummy");
        let alice = new Address("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");

        const TokenFoo = (amount: BigNumber.Value) =>
            new TokenTransfer({ token: new Token({ identifier: "FOO-6ce17b" }), amount: BigInt(amount.toString()) });
        const TokenBar = (amount: BigNumber.Value) =>
            new TokenTransfer({ token: new Token({ identifier: "BAR-5bc08f" }), amount: BigInt(amount.toString()) });
        const LKMEX = (nonce: number, amount: BigNumber.Value) =>
            new TokenTransfer({
                token: new Token({ identifier: "LKMEX-aab910", nonce: BigInt(nonce) }),
                amount: BigInt(amount.toString()),
            });
        const nonFungibleToken = (nonce: number) =>
            new TokenTransfer({ token: new Token({ identifier: "MOS-b9b4b2", nonce: BigInt(nonce) }), amount: 1n });

        const hexFoo = "464f4f2d366365313762";
        const hexBar = "4241522d356263303866";
        const hexLKMEX = "4c4b4d45582d616162393130";
        const hexNFT = "4d4f532d623962346232";
        const hexContractAddress = contract.getAddress().toHex();
        const hexDummyFunction = "64756d6d79";

        // ESDT, single
        let transaction = new Interaction(contract, dummyFunction, [])
            .withSender(alice)
            .withSingleESDTTransfer(TokenFoo(10))
            .buildTransaction();

        assert.equal(transaction.data.toString(), `ESDTTransfer@${hexFoo}@0a@${hexDummyFunction}`);

        // Meta ESDT (special SFT), single
        transaction = new Interaction(contract, dummyFunction, [])
            .withSender(alice)
            .withSingleESDTNFTTransfer(LKMEX(123456, "123456000000000000000"))
            .buildTransaction();

        assert.equal(transaction.sender.toBech32(), alice.toBech32());
        assert.equal(transaction.receiver.toBech32(), alice.toBech32());
        assert.equal(
            transaction.data.toString(),
            `ESDTNFTTransfer@${hexLKMEX}@01e240@06b14bd1e6eea00000@${hexContractAddress}@${hexDummyFunction}`,
        );

        // Meta ESDT (special SFT), single, but using "withSender()" (recommended)
        transaction = new Interaction(contract, dummyFunction, [])
            .withSingleESDTNFTTransfer(LKMEX(123456, 123456000000000000000))
            .withSender(alice)
            .buildTransaction();

        assert.equal(transaction.sender.toBech32(), alice.toBech32());
        assert.equal(transaction.receiver.toBech32(), alice.toBech32());
        assert.equal(
            transaction.data.toString(),
            `ESDTNFTTransfer@${hexLKMEX}@01e240@06b14bd1e6eea00000@${hexContractAddress}@${hexDummyFunction}`,
        );

        // NFT, single
        transaction = new Interaction(contract, dummyFunction, [])
            .withSender(alice)
            .withSingleESDTNFTTransfer(nonFungibleToken(1))
            .buildTransaction();

        assert.equal(transaction.sender.toBech32(), alice.toBech32());
        assert.equal(transaction.receiver.toBech32(), alice.toBech32());
        assert.equal(
            transaction.data.toString(),
            `ESDTNFTTransfer@${hexNFT}@01@01@${hexContractAddress}@${hexDummyFunction}`,
        );

        // NFT, single, but using "withSender()" (recommended)
        transaction = new Interaction(contract, dummyFunction, [])
            .withSingleESDTNFTTransfer(nonFungibleToken(1))
            .withSender(alice)
            .buildTransaction();

        assert.equal(transaction.sender.toBech32(), alice.toBech32());
        assert.equal(transaction.receiver.toBech32(), alice.toBech32());
        assert.equal(
            transaction.data.toString(),
            `ESDTNFTTransfer@${hexNFT}@01@01@${hexContractAddress}@${hexDummyFunction}`,
        );

        // ESDT, multiple
        transaction = new Interaction(contract, dummyFunction, [])
            .withSender(alice)
            .withMultiESDTNFTTransfer([TokenFoo(3), TokenBar(3140)])
            .buildTransaction();

        assert.equal(transaction.sender.toBech32(), alice.toBech32());
        assert.equal(transaction.receiver.toBech32(), alice.toBech32());
        assert.equal(
            transaction.data.toString(),
            `MultiESDTNFTTransfer@${hexContractAddress}@02@${hexFoo}@@03@${hexBar}@@0c44@${hexDummyFunction}`,
        );

        // ESDT, multiple, but using "withSender()" (recommended)
        transaction = new Interaction(contract, dummyFunction, [])
            .withMultiESDTNFTTransfer([TokenFoo(3), TokenBar(3140)])
            .withSender(alice)
            .buildTransaction();

        assert.equal(transaction.sender.toBech32(), alice.toBech32());
        assert.equal(transaction.receiver.toBech32(), alice.toBech32());
        assert.equal(
            transaction.data.toString(),
            `MultiESDTNFTTransfer@${hexContractAddress}@02@${hexFoo}@@03@${hexBar}@@0c44@${hexDummyFunction}`,
        );

        // NFT, multiple
        transaction = new Interaction(contract, dummyFunction, [])
            .withSender(alice)
            .withMultiESDTNFTTransfer([nonFungibleToken(1), nonFungibleToken(42)])
            .buildTransaction();

        assert.equal(transaction.sender.toBech32(), alice.toBech32());
        assert.equal(transaction.receiver.toBech32(), alice.toBech32());
        assert.equal(
            transaction.data.toString(),
            `MultiESDTNFTTransfer@${hexContractAddress}@02@${hexNFT}@01@01@${hexNFT}@2a@01@${hexDummyFunction}`,
        );

        // NFT, multiple, but using "withSender()" (recommended)
        transaction = new Interaction(contract, dummyFunction, [])
            .withMultiESDTNFTTransfer([nonFungibleToken(1), nonFungibleToken(42)])
            .withSender(alice)
            .buildTransaction();

        assert.equal(transaction.sender.toBech32(), alice.toBech32());
        assert.equal(transaction.receiver.toBech32(), alice.toBech32());
    });

    it("should create transaction, with ABI, with transfer & execute", async function () {
        const abi = await loadAbiRegistry("src/testdata/answer.abi.json");
        const contract = new SmartContract({ address: dummyAddress, abi: abi });
        const alice = new Address("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const token = new Token({ identifier: "FOO-abcdef", nonce: 0n });

        const transaction = contract.methods
            .getUltimateAnswer()
            .withChainID("T")
            .withSender(alice)
            .withGasLimit(543210n)
            .withSingleESDTTransfer(new TokenTransfer({ token, amount: 100n }))
            .withNonce(42n)
            .buildTransaction();

        assert.deepEqual(
            transaction,
            new Transaction({
                chainID: "T",
                sender: alice,
                receiver: dummyAddress,
                data: Buffer.from("ESDTTransfer@464f4f2d616263646566@64@676574556c74696d617465416e73776572"),
                gasLimit: 543210n,
                value: 0n,
                version: 2,
                nonce: 42n,
            }),
        );
    });

    it("should interact with 'answer'", async function () {
        this.timeout(30000);
        let abi = await loadAbiRegistry("src/testdata/answer.abi.json");
        let contract = new SmartContract({ address: dummyAddress, abi: abi });
        let controller = new SmartContractController({ chainID: "D", networkProvider: provider, abi: abi });

        let interaction = <Interaction>contract.methods.getUltimateAnswer().withGasLimit(543210n).withChainID("T");

        assert.equal(contract.getAddress(), dummyAddress);
        assert.deepEqual(interaction.getFunction(), new ContractFunction("getUltimateAnswer"));
        assert.lengthOf(interaction.getArguments(), 0);
        assert.deepEqual(interaction.getGasLimit(), 543210n);

        provider.mockQueryContractOnFunction(
            "getUltimateAnswer",
            new SmartContractQueryResponse({
                returnDataParts: [Buffer.from([42])],
                returnCode: "ok",
                returnMessage: "msg",
                function: "getUltimateAnswer",
            }),
        );

        // Query;

        const interactionQuery = interaction.buildQuery();
        let response = await controller.query({
            contract: interactionQuery.address,
            arguments: interactionQuery.getEncodedArguments(),
            function: interactionQuery.func.toString(),
            caller: interactionQuery.caller,
            value: BigInt(interactionQuery.value.toString()),
        });
        assert.isTrue(response.length == 1);
        assert.deepEqual(response[0], new BigNumber(42));

        // Execute, do not wait for execution
        let transaction = interaction.withSender(alice.address).withNonce(0n).buildTransaction();
        transaction.sender = alice.address;
        transaction.signature = await alice.signTransaction(transaction);
        let hash = await provider.sendTransaction(transaction);
        assert.equal(transaction.nonce, 0n);
        assert.equal(transaction.data.toString(), "getUltimateAnswer");
        assert.equal(hash, "3579ad09099feb9755c860ddd225251170806d833342e912fccdfe2ed5c3a364");

        transaction = interaction.withNonce(1n).buildTransaction();
        transaction.sender = alice.address;
        transaction.signature = await alice.signTransaction(transaction);
        hash = await provider.sendTransaction(transaction);
        assert.equal(transaction.nonce, 1n);
        assert.equal(hash, "ad513ce7c5d371d30e48f073326899766736eac1ac231d847d45bc3facbcb496");

        // Execute, and wait for execution
        transaction = interaction.withNonce(2n).buildTransaction();
        transaction.sender = alice.address;
        transaction.signature = await alice.signTransaction(transaction);
        provider.mockGetTransactionWithAnyHashAsNotarizedWithOneResult("@6f6b@2bs", "getUltimateAnswer");
        hash = await provider.sendTransaction(transaction);
        let responseExecute = await controller.awaitCompletedExecute(hash);

        assert.isTrue(responseExecute.values.length == 1);
        assert.deepEqual(responseExecute.values[0], new BigNumber(43));
        assert.isTrue(responseExecute.returnCode == "ok");
    });

    it("should interact with 'counter'", async function () {
        this.timeout(30000);
        let abi = await loadAbiRegistry("src/testdata/counter.abi.json");
        let contract = new SmartContract({ address: dummyAddress, abi: abi });
        let controller = new SmartContractController({ chainID: "D", networkProvider: provider, abi: abi });

        let getInteraction = <Interaction>contract.methodsExplicit.get();
        let incrementInteraction = (<Interaction>contract.methods.increment()).withGasLimit(543210n);
        let decrementInteraction = (<Interaction>contract.methods.decrement()).withGasLimit(987654n);

        // For "get()", return fake 7
        provider.mockQueryContractOnFunction(
            "get",
            new SmartContractQueryResponse({
                returnDataParts: [Buffer.from([7])],
                returnCode: "ok",
                function: "get",
                returnMessage: "",
            }),
        );

        // Query "get()"
        const interactionQuery = getInteraction.buildQuery();
        let response = await controller.query({
            contract: interactionQuery.address,
            arguments: interactionQuery.getEncodedArguments(),
            function: interactionQuery.func.toString(),
            caller: interactionQuery.caller,
            value: BigInt(interactionQuery.value.toString()),
        });
        assert.deepEqual(response[0], new BigNumber(7));

        let incrementTransaction = incrementInteraction
            .withSender(alice.address)
            .withNonce(14n)
            .withChainID("mock")
            .buildTransaction();

        incrementTransaction.signature = await alice.signTransaction(incrementTransaction);
        provider.mockGetTransactionWithAnyHashAsNotarizedWithOneResult("@6f6b@08", "increment");
        let hash = await provider.sendTransaction(incrementTransaction);
        let responseExecute = await controller.awaitCompletedExecute(hash);
        assert.deepEqual(responseExecute.values[0], new BigNumber(8));

        // Decrement three times (simulate three parallel broadcasts). Wait for execution of the latter (third transaction). Return fake "5".
        // Decrement #1
        let decrementTransaction = decrementInteraction
            .withSender(alice.address)
            .withNonce(15n)
            .withChainID("mock")
            .buildTransaction();

        decrementTransaction.signature = await alice.signTransaction(decrementTransaction);
        await provider.sendTransaction(decrementTransaction);
        // Decrement #2
        decrementTransaction = decrementInteraction.withNonce(16n).buildTransaction();
        decrementTransaction.signature = await alice.signTransaction(decrementTransaction);
        await provider.sendTransaction(decrementTransaction);
        // Decrement #3

        decrementTransaction = decrementInteraction.withNonce(17n).buildTransaction();
        decrementTransaction.signature = await alice.signTransaction(decrementTransaction);
        provider.mockGetTransactionWithAnyHashAsNotarizedWithOneResult("@6f6b@05", "decrement");
        hash = await provider.sendTransaction(decrementTransaction);
        responseExecute = await controller.awaitCompletedExecute(hash);
        assert.deepEqual(responseExecute.values[0], new BigNumber(5));
    });

    it("should interact with 'lottery-esdt'", async function () {
        this.timeout(30000);
        let abi = await loadAbiRegistry("src/testdata/lottery-esdt.abi.json");
        let contract = new SmartContract({ address: dummyAddress, abi: abi });
        let controller = new SmartContractController({ chainID: "D", networkProvider: provider, abi: abi });

        let startInteraction = <Interaction>(
            contract.methodsExplicit
                .start([
                    BytesValue.fromUTF8("lucky"),
                    new TokenIdentifierValue("lucky-token"),
                    new BigUIntValue(1),
                    OptionValue.newMissing(),
                    OptionValue.newMissing(),
                    OptionValue.newProvided(new U32Value(1)),
                    OptionValue.newMissing(),
                    OptionValue.newMissing(),
                    OptionalValue.newMissing(),
                ])
                .withGasLimit(5000000n)
        );

        let statusInteraction = <Interaction>contract.methods.status(["lucky"]).withGasLimit(5000000n);

        let getLotteryInfoInteraction = <Interaction>contract.methods.getLotteryInfo(["lucky"]).withGasLimit(5000000n);

        // start()
        let startTransaction = startInteraction
            .withSender(alice.address)
            .withNonce(14n)
            .withChainID("mock")
            .buildTransaction();

        startTransaction.signature = await alice.signTransaction(startTransaction);

        provider.mockGetTransactionWithAnyHashAsNotarizedWithOneResult("@6f6b", "start");
        let hash = await provider.sendTransaction(startTransaction);
        let response = await controller.awaitCompletedExecute(hash);

        assert.equal(startTransaction.data.toString(), "start@6c75636b79@6c75636b792d746f6b656e@01@@@0100000001@@");
        assert.isTrue(response.returnCode == "ok");
        assert.isTrue(response.values.length == 0);

        // status() (this is a view function, but for the sake of the test, we'll execute it)
        let statusTransaction = statusInteraction
            .withSender(alice.address)
            .withNonce(15n)
            .withChainID("mock")
            .buildTransaction();

        statusTransaction.signature = await alice.signTransaction(statusTransaction);
        provider.mockGetTransactionWithAnyHashAsNotarizedWithOneResult("@6f6b@01", "status");

        hash = await provider.sendTransaction(startTransaction);
        response = await controller.awaitCompletedExecute(hash);

        assert.equal(statusTransaction.data.toString(), "status@6c75636b79");
        assert.isTrue(response.returnCode == "ok");
        assert.isTrue(response.values.length == 1);
        assert.deepEqual(response.values[0]!.valueOf(), { name: "Running", fields: [] });

        // lotteryInfo() (this is a view function, but for the sake of the test, we'll execute it)
        let getLotteryInfoTransaction = getLotteryInfoInteraction
            .withSender(alice.address)
            .withNonce(15n)
            .withChainID("mock")
            .buildTransaction();

        getLotteryInfoTransaction.signature = await alice.signTransaction(getLotteryInfoTransaction);
        provider.mockGetTransactionWithAnyHashAsNotarizedWithOneResult(
            "@6f6b@0000000b6c75636b792d746f6b656e000000010100000000000000005fc2b9dbffffffff00000001640000000a140ec80fa7ee88000000",
            "getLotteryInfo",
        );
        hash = await provider.sendTransaction(startTransaction);
        response = await controller.awaitCompletedExecute(hash);
        assert.equal(getLotteryInfoTransaction.data.toString(), "getLotteryInfo@6c75636b79");
        assert.isTrue(response.returnCode == "ok");
        assert.isTrue(response.values.length == 1);

        assert.deepEqual(response.values[0]!.valueOf(), {
            token_identifier: "lucky-token",
            ticket_price: new BigNumber("1"),
            tickets_left: new BigNumber(0),
            deadline: new BigNumber("0x000000005fc2b9db", 16),
            max_entries_per_user: new BigNumber(0xffffffff),
            prize_distribution: Buffer.from([0x64]),
            prize_pool: new BigNumber("94720000000000000000000"),
        });
    });
});
