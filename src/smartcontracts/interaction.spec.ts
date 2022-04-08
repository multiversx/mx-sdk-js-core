import { ContractController } from "../testutils/contractController";
import { SmartContract } from "./smartContract";
import { BigUIntValue, OptionalValue, OptionValue, TokenIdentifierValue, U32Value } from "./typesystem";
import {
    loadAbiRegistry,
    loadTestWallets,
    MockProvider,
    setupUnitTestWatcherTimeouts,
    TestWallet,
} from "../testutils";
import { SmartContractAbi } from "./abi";
import { Address } from "../address";
import { assert } from "chai";
import { Interaction } from "./interaction";
import { ChainID, GasLimit } from "../networkParams";
import { ContractFunction } from "./function";
import { Nonce } from "../nonce";
import { ReturnCode } from "./returnCode";
import { Balance } from "../balance";
import BigNumber from "bignumber.js";
import { BytesValue } from "./typesystem/bytes";
import { Token, TokenType } from "../token";
import { createBalanceBuilder } from "../balanceBuilder";
import { ContractQueryResponse } from "@elrondnetwork/erdjs-network-providers";

describe("test smart contract interactor", function() {
    let dummyAddress = new Address("erd1qqqqqqqqqqqqqpgqak8zt22wl2ph4tswtyc39namqx6ysa2sd8ss4xmlj3");
    let provider = new MockProvider();
    let alice: TestWallet;

    before(async function() {
        ({ alice } = await loadTestWallets());
    });

    it("should set transaction fields", async function () {
        let contract = new SmartContract({ address: dummyAddress });
        let dummyFunction = new ContractFunction("dummy");
        let interaction = new Interaction(contract, dummyFunction, []);

        let transaction = interaction
            .withNonce(new Nonce(7))
            .withValue(Balance.egld(1))
            .withGasLimitComponents({ minGasLimit: 50000, gasPerDataByte: 1500, estimatedExecutionComponent: 20000000 })
            .buildTransaction();

        let expectedGasLimit = new GasLimit(50000)
            .add(new GasLimit("dummy".length * 1500))
            .add(new GasLimit(20000000));

        assert.deepEqual(transaction.getReceiver(), dummyAddress);
        assert.deepEqual(transaction.getValue(), Balance.egld(1));
        assert.deepEqual(transaction.getNonce(), new Nonce(7));
        assert.deepEqual(transaction.getGasLimit(), expectedGasLimit);
    });

    it("should set transfers (payments) on contract calls (transfer and execute)", async function () {
        let contract = new SmartContract({ address: dummyAddress });
        let dummyFunction = new ContractFunction("dummy");
        let alice = new Address("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        
        const TokenFoo = createBalanceBuilder(new Token({ identifier: "FOO-6ce17b", decimals: 0, type: TokenType.Fungible }));
        const TokenBar = createBalanceBuilder(new Token({ identifier: "BAR-5bc08f", decimals: 3, type: TokenType.Fungible }));
        const LKMEX = createBalanceBuilder(new Token({ identifier: "LKMEX-aab910", decimals: 18, type: TokenType.Semifungible }));
        const Strămoși = createBalanceBuilder(new Token({ identifier: "MOS-b9b4b2", decimals: 0, type: TokenType.Nonfungible }));

        const hexFoo = "464f4f2d366365313762";
        const hexBar = "4241522d356263303866";
        const hexLKMEX = "4c4b4d45582d616162393130";
        const hexStrămoși = "4d4f532d623962346232";
        const hexContractAddress = new Address(contract.getAddress().bech32()).hex();
        const hexDummyFunction = "64756d6d79";

        // ESDT, single
        let transaction = new Interaction(contract, dummyFunction, [])
            .withSingleESDTTransfer(TokenFoo("10"))
            .buildTransaction();

        assert.equal(transaction.getData().toString(), `ESDTTransfer@${hexFoo}@0a@${hexDummyFunction}`);

        // Meta ESDT (special SFT), single
        transaction = new Interaction(contract, dummyFunction, [])
            .withSingleESDTNFTTransfer(LKMEX.nonce(123456).value(123.456), alice)
            .buildTransaction();

        assert.equal(transaction.getData().toString(), `ESDTNFTTransfer@${hexLKMEX}@01e240@06b14bd1e6eea00000@${hexContractAddress}@${hexDummyFunction}`);

        // NFT, single
        transaction = new Interaction(contract, dummyFunction, [])
            .withSingleESDTNFTTransfer(Strămoși.nonce(1).one(), alice)
            .buildTransaction();

        assert.equal(transaction.getData().toString(), `ESDTNFTTransfer@${hexStrămoși}@01@01@${hexContractAddress}@${hexDummyFunction}`);

        // ESDT, multiple
        transaction = new Interaction(contract, dummyFunction, [])
            .withMultiESDTNFTTransfer([TokenFoo(3), TokenBar(3.14)], alice)
            .buildTransaction();

        assert.equal(transaction.getData().toString(), `MultiESDTNFTTransfer@${hexContractAddress}@02@${hexFoo}@@03@${hexBar}@@0c44@${hexDummyFunction}`);

        // NFT, multiple
        transaction = new Interaction(contract, dummyFunction, [])
            .withMultiESDTNFTTransfer([Strămoși.nonce(1).one(), Strămoși.nonce(42).one()], alice)
            .buildTransaction();
        
        assert.equal(transaction.getData().toString(), `MultiESDTNFTTransfer@${hexContractAddress}@02@${hexStrămoși}@01@01@${hexStrămoși}@2a@01@${hexDummyFunction}`);
    });

    it("should interact with 'answer'", async function () {
        setupUnitTestWatcherTimeouts();

        let abiRegistry = await loadAbiRegistry(["src/testdata/answer.abi.json"]);
        let abi = new SmartContractAbi(abiRegistry, ["answer"]);
        let contract = new SmartContract({ address: dummyAddress, abi: abi });
        let controller = new ContractController(provider);

        let interaction = <Interaction>contract.methods
            .getUltimateAnswer()
            .withGasLimit(new GasLimit(543210))
            .withChainID(new ChainID("T"));

        assert.equal(contract.getAddress(), dummyAddress);
        assert.deepEqual(interaction.getFunction(), new ContractFunction("getUltimateAnswer"));
        assert.lengthOf(interaction.getArguments(), 0);
        assert.deepEqual(interaction.getGasLimit(), new GasLimit(543210));

        provider.mockQueryContractOnFunction(
            "getUltimateAnswer",
            new ContractQueryResponse({ returnData: [Buffer.from([42]).toString("base64")], returnCode: ReturnCode.Ok })
        );

        // Query
        let { values: queryValues, firstValue: queryAnwser, returnCode: queryCode } = await controller.query(
            interaction
        );
        assert.lengthOf(queryValues, 1);
        assert.deepEqual(queryAnwser!.valueOf(), new BigNumber(42));
        assert.isTrue(queryCode.equals(ReturnCode.Ok));

        // Execute, do not wait for execution
        let transaction = interaction.withNonce(new Nonce(0)).buildTransaction();
        await alice.signer.sign(transaction);
        await provider.sendTransaction(transaction);
        assert.equal(transaction.getNonce().valueOf(), 0);
        assert.equal(transaction.getData().toString(), "getUltimateAnswer");
        assert.equal(
            transaction.getHash().toString(),
            "60d0956a8902c1179dce92d91bd9670e31b9a9cd07c1d620edb7754a315b4818"
        );

        transaction = interaction.withNonce(new Nonce(1)).buildTransaction();
        await alice.signer.sign(transaction);
        await provider.sendTransaction(transaction);
        assert.equal(transaction.getNonce().valueOf(), 1);
        assert.equal(
            transaction.getHash().toString(),
            "acd207c38f6c3341b18d8ef331fa07ba49615fa12d7610aad5d8495293049f24"
        );

        // Execute, and wait for execution
        transaction = interaction.withNonce(new Nonce(2)).buildTransaction();
        await alice.signer.sign(transaction);
        provider.mockGetTransactionWithAnyHashAsNotarizedWithOneResult("@6f6b@2bs");
        let { bundle } = await controller.execute(interaction, transaction);

        assert.lengthOf(bundle.values, 1);
        assert.deepEqual(bundle.firstValue!.valueOf(), new BigNumber(43));
        assert.isTrue(bundle.returnCode.equals(ReturnCode.Ok));
    });

    it("should interact with 'counter'", async function() {
        setupUnitTestWatcherTimeouts();

        let abiRegistry = await loadAbiRegistry(["src/testdata/counter.abi.json"]);
        let abi = new SmartContractAbi(abiRegistry, ["counter"]);
        let contract = new SmartContract({ address: dummyAddress, abi: abi });
        let controller = new ContractController(provider);

        let getInteraction = <Interaction>contract.methodsExplicit.get().check();
        let incrementInteraction = (<Interaction>contract.methods.increment()).withGasLimit(new GasLimit(543210));
        let decrementInteraction = (<Interaction>contract.methods.decrement()).withGasLimit(new GasLimit(987654));

        // For "get()", return fake 7
        provider.mockQueryContractOnFunction(
            "get",
            new ContractQueryResponse({ returnData: [Buffer.from([7]).toString("base64")], returnCode: ReturnCode.Ok })
        );

        // Query "get()"
        let { firstValue: counterValue } = await controller.query(getInteraction);

        assert.deepEqual(counterValue!.valueOf(), new BigNumber(7));

        let incrementTransaction = incrementInteraction.withNonce(new Nonce(14)).buildTransaction();
        await alice.signer.sign(incrementTransaction);
        provider.mockGetTransactionWithAnyHashAsNotarizedWithOneResult("@6f6b@08");
        let { bundle: { firstValue: valueAfterIncrement } } = await controller.execute(incrementInteraction, incrementTransaction);
        assert.deepEqual(valueAfterIncrement!.valueOf(), new BigNumber(8));

        // Decrement three times (simulate three parallel broadcasts). Wait for execution of the latter (third transaction). Return fake "5".
        // Decrement #1
        let decrementTransaction = decrementInteraction.withNonce(new Nonce(15)).buildTransaction();
        await alice.signer.sign(decrementTransaction);
        await provider.sendTransaction(decrementTransaction);
        // Decrement #2
        decrementTransaction = decrementInteraction.withNonce(new Nonce(16)).buildTransaction();
        await alice.signer.sign(decrementTransaction);
        await provider.sendTransaction(decrementTransaction);
        // Decrement #3

        decrementTransaction = decrementInteraction.withNonce(new Nonce(17)).buildTransaction();
        await alice.signer.sign(decrementTransaction);
        provider.mockGetTransactionWithAnyHashAsNotarizedWithOneResult("@6f6b@05");
        let { bundle: { firstValue: valueAfterDecrement } } = await controller.execute(decrementInteraction, decrementTransaction);
        assert.deepEqual(valueAfterDecrement!.valueOf(), new BigNumber(5));
    });

    it("should interact with 'lottery-esdt'", async function() {
        setupUnitTestWatcherTimeouts();

        let abiRegistry = await loadAbiRegistry(["src/testdata/lottery-esdt.abi.json"]);
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
                .withGasLimit(new GasLimit(5000000))
                .check()
        );

        let statusInteraction = <Interaction>(
            contract.methods.status(["lucky"]).withGasLimit(new GasLimit(5000000))
        );

        let getLotteryInfoInteraction = <Interaction>(
            contract.methods.getLotteryInfo(["lucky"]).withGasLimit(new GasLimit(5000000))
        );

        // start()
        let startTransaction = startInteraction.withNonce(new Nonce(14)).buildTransaction();
        await alice.signer.sign(startTransaction);
        provider.mockGetTransactionWithAnyHashAsNotarizedWithOneResult("@6f6b");
        let { bundle: { returnCode: startReturnCode, values: startReturnValues } } = await controller.execute(startInteraction, startTransaction);

        assert.equal(startTransaction.getData().toString(), "start@6c75636b79@6c75636b792d746f6b656e@01@@@0100000001@@");
        assert.isTrue(startReturnCode.equals(ReturnCode.Ok));
        assert.lengthOf(startReturnValues, 0);

        // status() (this is a view function, but for the sake of the test, we'll execute it)
        let statusTransaction = statusInteraction.withNonce(new Nonce(15)).buildTransaction();
        await alice.signer.sign(statusTransaction);
        provider.mockGetTransactionWithAnyHashAsNotarizedWithOneResult("@6f6b@01");
        let { bundle: { returnCode: statusReturnCode, values: statusReturnValues, firstValue: statusFirstValue } } = await controller.execute(statusInteraction, statusTransaction);

        assert.equal(statusTransaction.getData().toString(),"status@6c75636b79");
        assert.isTrue(statusReturnCode.equals(ReturnCode.Ok));
        assert.lengthOf(statusReturnValues, 1);
        assert.deepEqual(statusFirstValue!.valueOf(), { name: "Running", fields: [] });

        // lotteryInfo() (this is a view function, but for the sake of the test, we'll execute it)
        let getLotteryInfoTransaction = getLotteryInfoInteraction.withNonce(new Nonce(15)).buildTransaction();
        await alice.signer.sign(getLotteryInfoTransaction);
        provider.mockGetTransactionWithAnyHashAsNotarizedWithOneResult("@6f6b@0000000b6c75636b792d746f6b656e000000010100000000000000005fc2b9dbffffffff00000001640000000a140ec80fa7ee88000000");
        let { bundle: { returnCode: infoReturnCode, values: infoReturnValues, firstValue: infoFirstValue} } = await controller.execute(getLotteryInfoInteraction, getLotteryInfoTransaction);

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
