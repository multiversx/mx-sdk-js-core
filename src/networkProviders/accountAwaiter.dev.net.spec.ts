import { assert } from "chai";
import { Account } from "../accounts";
import { Address, Transaction } from "../core";
import { MarkCompleted, MockNetworkProvider, Wait } from "../testutils/mockNetworkProvider";
import { createAccountBalance, getTestWalletsPath } from "../testutils/utils";
import { AccountAwaiter } from "./accountAwaiter";
import { AccountOnNetwork } from "./accounts";
import { ApiNetworkProvider } from "./apiNetworkProvider";

describe("AccountAwaiter Tests", () => {
    const provider = new MockNetworkProvider();

    const watcher = new AccountAwaiter({
        fetcher: provider,
        pollingIntervalInMilliseconds: 42,
        timeoutIntervalInMilliseconds: 42 * 42,
        patienceTimeInMilliseconds: 0,
    });

    it("should await on balance increase", async () => {
        const alice = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        // alice account is created with 1000 EGLD
        const initialBalance = (await provider.getAccount(alice)).balance;

        // Mock balance timeline
        provider.mockAccountBalanceTimelineByAddress(alice, [
            new Wait(40),
            new Wait(40),
            new Wait(45),
            new MarkCompleted(),
        ]);

        const condition = (account: AccountOnNetwork) => {
            return account.balance === initialBalance + createAccountBalance(7);
        };

        const account = await watcher.awaitOnCondition(alice, condition);

        assert.equal(account.balance, createAccountBalance(1007));
    });

    it("should await for account balance increase on the network", async function () {
        this.timeout(20000);
        const alice = await Account.newFromPem(`${getTestWalletsPath()}/alice.pem`);
        const aliceAddress = alice.address;
        const frank = Address.newFromBech32("erd1kdl46yctawygtwg2k462307dmz2v55c605737dp3zkxh04sct7asqylhyv");

        const api = new ApiNetworkProvider("https://devnet-api.multiversx.com");
        const watcher = new AccountAwaiter({ fetcher: api });
        const value = 100_000n;

        // Create and sign the transaction
        const transaction = new Transaction({
            sender: aliceAddress,
            receiver: frank,
            gasLimit: 50000n,
            chainID: "D",
            value,
        });
        transaction.nonce = (await api.getAccount(aliceAddress)).nonce;
        transaction.signature = await alice.signTransaction(transaction);

        const initialBalance = (await api.getAccount(frank)).balance;

        const condition = (account: AccountOnNetwork) => {
            return account.balance === initialBalance + value;
        };

        await api.sendTransaction(transaction);

        const accountOnNetwork = await watcher.awaitOnCondition(frank, condition);

        assert.equal(accountOnNetwork.balance, initialBalance + value);
    });
});
