import {
    MockProvider,
    setupUnitTestWatcherTimeouts,
    TestWallet,
} from "../../testutils";
import { Address } from "../../address";
import { assert } from "chai";
import { ContractQueryResponse } from "../../networkProvider/contractQueryResponse";
import { ReturnCode } from "../returnCode";
import BigNumber from "bignumber.js";
import { SystemWrapper } from "./systemWrapper";
import { setupInteractiveWithProvider } from "../../interactive";
import { Egld } from "../../balanceBuilder";

describe("test smart contract wrapper", async function() {
    let dummyAddress = new Address("erd1qqqqqqqqqqqqqpgqak8zt22wl2ph4tswtyc39namqx6ysa2sd8ss4xmlj3");
    let erdSys: SystemWrapper;
    let provider = new MockProvider();
    let alice: TestWallet;
    before(async function() {
        ({
            erdSys,
            wallets: { alice },
        } = await setupInteractiveWithProvider(provider));
    });

    it("should interact with 'answer'", async function() {
        setupUnitTestWatcherTimeouts();

        let answer = await erdSys.loadWrapper("src/testdata", "answer");
        answer
            .address(dummyAddress)
            .sender(alice)
            .gas(500_000);

        mockQuery(provider, "getUltimateAnswer", "Kg==");

        let queryResult = await answer.query.getUltimateAnswer();
        assert.deepEqual(queryResult, new BigNumber(42));

        let callResult = await mockCall(provider, "@6f6b@2b", answer.call.getUltimateAnswer());
        assert.deepEqual(callResult, new BigNumber(43));
    });

    it("should interact with 'counter'", async function() {
        setupUnitTestWatcherTimeouts();

        let counter = await erdSys.loadWrapper("src/testdata", "counter");
        counter
            .address(dummyAddress)
            .sender(alice)
            .gas(500_000);

        // For "get()", return fake 7
        mockQuery(provider, "get", "Bw==");

        let counterValue = await counter.query.get();
        assert.deepEqual(counterValue, new BigNumber(7));

        // Return fake 8
        let valueAfterIncrement = await mockCall(provider, "@6f6b@08", counter.call.increment());
        assert.deepEqual(valueAfterIncrement, new BigNumber(8));

        // Decrement. Return fake 7.
        let decrementResult = await mockCall(provider, "@6f6b@07", counter.call.decrement());
        assert.deepEqual(decrementResult, new BigNumber(7));
    });

    it("should interact with 'lottery-esdt'", async function() {
        setupUnitTestWatcherTimeouts();

        let lottery = await erdSys.loadWrapper("src/testdata", "lottery-esdt");
        lottery
            .address(dummyAddress)
            .sender(alice)
            .gas(5_000_000);

        await mockCall(provider, "@6f6b", lottery.call.start("lucky", "lucky-token", 1, null, null, 1, null, null));

        let status = await mockCall(provider, "@6f6b@01", lottery.call.status("lucky"));
        assert.deepEqual(status, { name: "Running", fields: [] });

        let info = await mockCall(
            provider,
            "@6f6b@0000000b6c75636b792d746f6b656e000000010100000000000000005fc2b9dbffffffff00000001640000000a140ec80fa7ee88000000",
            lottery.call.getLotteryInfo("lucky")
        );

        assert.deepEqual(info, {
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

function mockQuery(provider: MockProvider, functionName: string, mockedResult: string) {
    provider.mockQueryContractOnFunction(
        functionName,
        new ContractQueryResponse({ returnData: [mockedResult], returnCode: ReturnCode.Ok })
    );
}

async function mockCall(provider: MockProvider, mockedResult: string, promise: Promise<any>) {
    provider.mockGetTransactionWithAnyHashAsNotarizedWithOneResult(mockedResult);
    return await promise;
}
