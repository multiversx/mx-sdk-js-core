import { ContractQueryResponse } from "@multiversx/sdk-network-providers";
import BigNumber from "bignumber.js";
import { assert } from "chai";
import { Address } from "../address";
import {
    loadAbiRegistry,
    loadTestWallets,
    MockProvider,
    setupUnitTestWatcherTimeouts,
    TestWallet
} from "../testutils";
import { ContractController } from "../testutils/contractController";
import { TokenPayment } from "../tokenPayment";
import { SmartContractAbi } from "./abi";
import { ContractFunction } from "./function";
import { Interaction } from "./interaction";
import { ReturnCode } from "./returnCode";
import { SmartContract } from "./smartContract";
import { BigUIntValue, OptionalValue, OptionValue, TokenIdentifierValue, U32Value } from "./typesystem";
import { BytesValue } from "./typesystem/bytes";

describe("test smart contract interactor", function () {
    let dummyAddress = new Address("erd1qqqqqqqqqqqqqpgqak8zt22wl2ph4tswtyc39namqx6ysa2sd8ss4xmlj3");
    let provider = new MockProvider();
    let alice: TestWallet;

    before(async function () {
        ({ alice } = await loadTestWallets());
    });

    it("should set transaction fields", async function () {
        let contract = new SmartContract({ address: dummyAddress });
        let dummyFunction = new ContractFunction("dummy");
        let interaction = new Interaction(contract, dummyFunction, []);

        let transaction = interaction
            .withNonce(7)
            .withValue(TokenPayment.egldFromAmount(1))
            .withGasLimit(20000000)
            .buildTransaction();

        assert.deepEqual(transaction.getReceiver(), dummyAddress);
        assert.equal(transaction.getValue().toString(), "1000000000000000000");
        assert.equal(transaction.getNonce(), 7);
        assert.equal(transaction.getGasLimit().valueOf(), 20000000);
    });

    it("should set transfers (payments) on contract calls (transfer and execute)", async function () {
        let contract = new SmartContract({ address: dummyAddress });
        let dummyFunction = new ContractFunction("dummy");
        let alice = new Address("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");

        const TokenFoo = (amount: BigNumber.Value) => TokenPayment.fungibleFromAmount("FOO-6ce17b", amount, 0);
        const TokenBar = (amount: BigNumber.Value) => TokenPayment.fungibleFromAmount("BAR-5bc08f", amount, 3);
        const LKMEX = (nonce: number, amount: BigNumber.Value) => TokenPayment.metaEsdtFromAmount("LKMEX-aab910", nonce, amount, 18);
        const Strămoși = (nonce: number) => TokenPayment.nonFungible("MOS-b9b4b2", nonce);

        const hexFoo = "464f4f2d366365313762";
        const hexBar = "4241522d356263303866";
        const hexLKMEX = "4c4b4d45582d616162393130";
        const hexStrămoși = "4d4f532d623962346232";
        const hexContractAddress = new Address(contract.getAddress().bech32()).hex();
        const hexDummyFunction = "64756d6d79";

        // ESDT, single
        let transaction = new Interaction(contract, dummyFunction, [])
            .withSingleESDTTransfer(TokenFoo(10))
            .buildTransaction();

        assert.equal(transaction.getData().toString(), `ESDTTransfer@${hexFoo}@0a@${hexDummyFunction}`);

        // Meta ESDT (special SFT), single
        transaction = new Interaction(contract, dummyFunction, [])
            .withSingleESDTNFTTransfer(LKMEX(123456, 123.456), alice)
            .buildTransaction();

        assert.equal(transaction.getData().toString(), `ESDTNFTTransfer@${hexLKMEX}@01e240@06b14bd1e6eea00000@${hexContractAddress}@${hexDummyFunction}`);

        // NFT, single
        transaction = new Interaction(contract, dummyFunction, [])
            .withSingleESDTNFTTransfer(Strămoși(1), alice)
            .buildTransaction();

        assert.equal(transaction.getData().toString(), `ESDTNFTTransfer@${hexStrămoși}@01@01@${hexContractAddress}@${hexDummyFunction}`);

        // ESDT, multiple
        transaction = new Interaction(contract, dummyFunction, [])
            .withMultiESDTNFTTransfer([TokenFoo(3), TokenBar(3.14)], alice)
            .buildTransaction();

        assert.equal(transaction.getData().toString(), `MultiESDTNFTTransfer@${hexContractAddress}@02@${hexFoo}@@03@${hexBar}@@0c44@${hexDummyFunction}`);

        // NFT, multiple
        transaction = new Interaction(contract, dummyFunction, [])
            .withMultiESDTNFTTransfer([Strămoși(1), Strămoși(42)], alice)
            .buildTransaction();

        assert.equal(transaction.getData().toString(), `MultiESDTNFTTransfer@${hexContractAddress}@02@${hexStrămoși}@01@01@${hexStrămoși}@2a@01@${hexDummyFunction}`);
    });

    it("should interact with 'answer'", async function () {
        setupUnitTestWatcherTimeouts();

        let abiRegistry = await loadAbiRegistry("src/testdata/answer.abi.json");
        let abi = new SmartContractAbi(abiRegistry, ["answer"]);
        let contract = new SmartContract({ address: dummyAddress, abi: abi });
        let controller = new ContractController(provider);

        let interaction = <Interaction>contract.methods
            .getUltimateAnswer()
            .withGasLimit(543210)
            .withChainID("T");

        assert.equal(contract.getAddress(), dummyAddress);
        assert.deepEqual(interaction.getFunction(), new ContractFunction("getUltimateAnswer"));
        assert.lengthOf(interaction.getArguments(), 0);
        assert.deepEqual(interaction.getGasLimit(), 543210);

        provider.mockQueryContractOnFunction(
            "getUltimateAnswer",
            new ContractQueryResponse({ returnData: [Buffer.from([42]).toString("base64")], returnCode: "ok" })
        );

        // Query
        let { values: queryValues, firstValue: queryAnwser, returnCode: queryCode } = await controller.query(
            interaction
        );
        assert.lengthOf(queryValues, 1);
        assert.deepEqual(queryAnwser!.valueOf(), new BigNumber(42));
        assert.isTrue(queryCode.equals(ReturnCode.Ok));

        // Execute, do not wait for execution
        let transaction = interaction.withNonce(0).buildTransaction();
        await alice.signer.sign(transaction);
        await provider.sendTransaction(transaction);
        assert.equal(transaction.getNonce().valueOf(), 0);
        assert.equal(transaction.getData().toString(), "getUltimateAnswer");
        assert.equal(
            transaction.getHash().toString(),
            "60d0956a8902c1179dce92d91bd9670e31b9a9cd07c1d620edb7754a315b4818"
        );

        transaction = interaction.withNonce(1).buildTransaction();
        await alice.signer.sign(transaction);
        await provider.sendTransaction(transaction);
        assert.equal(transaction.getNonce().valueOf(), 1);
        assert.equal(
            transaction.getHash().toString(),
            "acd207c38f6c3341b18d8ef331fa07ba49615fa12d7610aad5d8495293049f24"
        );

        // Execute, and wait for execution
        transaction = interaction.withNonce(2).buildTransaction();
        await alice.signer.sign(transaction);
        provider.mockGetTransactionWithAnyHashAsNotarizedWithOneResult("@6f6b@2bs");
        let { bundle } = await controller.execute(interaction, transaction);

        assert.lengthOf(bundle.values, 1);
        assert.deepEqual(bundle.firstValue!.valueOf(), new BigNumber(43));
        assert.isTrue(bundle.returnCode.equals(ReturnCode.Ok));
    });

    it("should interact with 'counter'", async function () {
        setupUnitTestWatcherTimeouts();

        let abiRegistry = await loadAbiRegistry("src/testdata/counter.abi.json");
        let abi = new SmartContractAbi(abiRegistry, ["counter"]);
        let contract = new SmartContract({ address: dummyAddress, abi: abi });
        let controller = new ContractController(provider);

        let getInteraction = <Interaction>contract.methodsExplicit.get().check();
        let incrementInteraction = (<Interaction>contract.methods.increment()).withGasLimit(543210);
        let decrementInteraction = (<Interaction>contract.methods.decrement()).withGasLimit(987654);

        // For "get()", return fake 7
        provider.mockQueryContractOnFunction(
            "get",
            new ContractQueryResponse({ returnData: [Buffer.from([7]).toString("base64")], returnCode: "ok" })
        );

        // Query "get()"
        let { firstValue: counterValue } = await controller.query(getInteraction);

        assert.deepEqual(counterValue!.valueOf(), new BigNumber(7));

        let incrementTransaction = incrementInteraction.withNonce(14).buildTransaction();
        await alice.signer.sign(incrementTransaction);
        provider.mockGetTransactionWithAnyHashAsNotarizedWithOneResult("@6f6b@08");
        let { bundle: { firstValue: valueAfterIncrement } } = await controller.execute(incrementInteraction, incrementTransaction);
        assert.deepEqual(valueAfterIncrement!.valueOf(), new BigNumber(8));

        // Decrement three times (simulate three parallel broadcasts). Wait for execution of the latter (third transaction). Return fake "5".
        // Decrement #1
        let decrementTransaction = decrementInteraction.withNonce(15).buildTransaction();
        await alice.signer.sign(decrementTransaction);
        await provider.sendTransaction(decrementTransaction);
        // Decrement #2
        decrementTransaction = decrementInteraction.withNonce(16).buildTransaction();
        await alice.signer.sign(decrementTransaction);
        await provider.sendTransaction(decrementTransaction);
        // Decrement #3

        decrementTransaction = decrementInteraction.withNonce(17).buildTransaction();
        await alice.signer.sign(decrementTransaction);
        provider.mockGetTransactionWithAnyHashAsNotarizedWithOneResult("@6f6b@05");
        let { bundle: { firstValue: valueAfterDecrement } } = await controller.execute(decrementInteraction, decrementTransaction);
        assert.deepEqual(valueAfterDecrement!.valueOf(), new BigNumber(5));
    });

    it("should interact with 'lottery-esdt'", async function () {
        setupUnitTestWatcherTimeouts();

        let abiRegistry = await loadAbiRegistry("src/testdata/lottery-esdt.abi.json");
        let abi = new SmartContractAbi(abiRegistry, ["Lottery"]);
        let contract = new SmartContract({ address: dummyAddress, abi: abi });
        let controller = new ContractController(provider);

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
                    OptionalValue.newMissing()
                ])
                .withGasLimit(5000000)
                .check()
        );

        let statusInteraction = <Interaction>(
            contract.methods.status(["lucky"]).withGasLimit(5000000)
        );

        let getLotteryInfoInteraction = <Interaction>(
            contract.methods.getLotteryInfo(["lucky"]).withGasLimit(5000000)
        );

        // start()
        let startTransaction = startInteraction.withNonce(14).buildTransaction();
        await alice.signer.sign(startTransaction);
        provider.mockGetTransactionWithAnyHashAsNotarizedWithOneResult("@6f6b");
        let { bundle: { returnCode: startReturnCode, values: startReturnValues } } = await controller.execute(startInteraction, startTransaction);

        assert.equal(startTransaction.getData().toString(), "start@6c75636b79@6c75636b792d746f6b656e@01@@@0100000001@@");
        assert.isTrue(startReturnCode.equals(ReturnCode.Ok));
        assert.lengthOf(startReturnValues, 0);

        // status() (this is a view function, but for the sake of the test, we'll execute it)
        let statusTransaction = statusInteraction.withNonce(15).buildTransaction();
        await alice.signer.sign(statusTransaction);
        provider.mockGetTransactionWithAnyHashAsNotarizedWithOneResult("@6f6b@01");
        let { bundle: { returnCode: statusReturnCode, values: statusReturnValues, firstValue: statusFirstValue } } = await controller.execute(statusInteraction, statusTransaction);

        assert.equal(statusTransaction.getData().toString(), "status@6c75636b79");
        assert.isTrue(statusReturnCode.equals(ReturnCode.Ok));
        assert.lengthOf(statusReturnValues, 1);
        assert.deepEqual(statusFirstValue!.valueOf(), { name: "Running", fields: [] });

        // lotteryInfo() (this is a view function, but for the sake of the test, we'll execute it)
        let getLotteryInfoTransaction = getLotteryInfoInteraction.withNonce(15).buildTransaction();
        await alice.signer.sign(getLotteryInfoTransaction);
        provider.mockGetTransactionWithAnyHashAsNotarizedWithOneResult("@6f6b@0000000b6c75636b792d746f6b656e000000010100000000000000005fc2b9dbffffffff00000001640000000a140ec80fa7ee88000000");
        let { bundle: { returnCode: infoReturnCode, values: infoReturnValues, firstValue: infoFirstValue } } = await controller.execute(getLotteryInfoInteraction, getLotteryInfoTransaction);

        assert.equal(getLotteryInfoTransaction.getData().toString(), "getLotteryInfo@6c75636b79");
        assert.isTrue(infoReturnCode.equals(ReturnCode.Ok));
        assert.lengthOf(infoReturnValues, 1);

        assert.deepEqual(infoFirstValue!.valueOf(), {
            token_identifier: "lucky-token",
            ticket_price: new BigNumber("1"),
            tickets_left: new BigNumber(0),
            deadline: new BigNumber("0x000000005fc2b9db", 16),
            max_entries_per_user: new BigNumber(0xffffffff),
            prize_distribution: Buffer.from([0x64]),
            prize_pool: new BigNumber("94720000000000000000000")
        });
    });
});
