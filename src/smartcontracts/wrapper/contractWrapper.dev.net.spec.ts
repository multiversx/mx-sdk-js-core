import { SystemWrapper, Balance, setupInteractive } from "../..";
import { assert } from "chai";
import { BigNumber } from "bignumber.js";
import { TestWallet } from "../../testutils";


describe("test smart contract interactor", function () {
    let erdSys: SystemWrapper;
    let alice: TestWallet;

    before(async function () {
        ({ erdSys, wallets: { alice } } = await setupInteractive("local-testnet"));
    });

    it("should interact with 'answer' (local testnet)", async function () {
        // Currently, this has to be called before creating any Interaction objects, 
        // because the Transaction objects created under the hood point to the "default" NetworkConfig.
        this.timeout(60000);

        let answer = await erdSys.loadWrapper("src/testdata", "answer");

        await answer.sender(alice).gas(3_000_000).deploy();

        // Query
        let queryResponse = await answer.query.getUltimateAnswer();
        assert.deepEqual(queryResponse, new BigNumber(42));

        // Call
        let callResponse = await answer.call.getUltimateAnswer();
        assert.deepEqual(callResponse, new BigNumber(42));
    });

    it("should interact with 'counter' (local testnet)", async function () {
        this.timeout(120000);

        let counter = await erdSys.loadWrapper("src/testdata", "counter");

        await counter.sender(alice).gas(3_000_000).deploy();
        assert.deepEqual(await counter.query.get(), new BigNumber(1));
        assert.deepEqual(await counter.call.increment(), new BigNumber(2));
        assert.deepEqual(await counter.call.decrement(), new BigNumber(1));
        assert.deepEqual(await counter.call.decrement(), new BigNumber(0));
    });

    it("should interact with 'lottery_egld' (local testnet)", async function () {
        this.timeout(120000);

        let lottery = await erdSys.loadWrapper("src/testdata", "lottery_egld");

        await lottery.sender(alice).gas(100_000_000).deploy();

        lottery.gas(15_000_000);
        await lottery.call.start("lucky", Balance.egld(1), null, null, 1, null, null);

        let status = await lottery.query.status("lucky");
        assert.equal(status.valueOf(), "Running");

        let info = await lottery.query.lotteryInfo("lucky");
        // Ignore "deadline" field in our test
        delete info.deadline;

        assert.deepEqual(info, {
            ticket_price: new BigNumber("1000000000000000000"),
            tickets_left: new BigNumber(800),
            max_entries_per_user: new BigNumber(1),
            prize_distribution: Buffer.from([0x64]),
            whitelist: [],
            current_ticket_number: new BigNumber(0),
            prize_pool: new BigNumber("0")
        });
    });
});
