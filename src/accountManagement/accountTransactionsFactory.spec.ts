import { assert } from "chai";
import { Address, TransactionsFactoryConfig } from "../core";
import { AccountTransactionsFactory } from "./accountTransactionsFactory";

describe("test account transactions factory", function () {
    const config = new TransactionsFactoryConfig({ chainID: "D" });
    const factory = new AccountTransactionsFactory({ config: config });

    it("should create 'Transaction' for saving key value", async function () {
        const sender = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const keyValuePairs = new Map([[Buffer.from("key0"), Buffer.from("value0")]]);

        const transaction = factory.createTransactionForSavingKeyValue(sender, {
            keyValuePairs: keyValuePairs,
        });

        assert.deepEqual(
            transaction.sender,
            Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
        );
        assert.deepEqual(
            transaction.receiver,
            Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
        );
        assert.equal(Buffer.from(transaction.data).toString(), "SaveKeyValue@6b657930@76616c756530");
        assert.equal(transaction.value, 0n);
        assert.equal(transaction.chainID, config.chainID);
        assert.equal(transaction.gasLimit, 271000n);
    });

    it("should create 'Transaction' for setting guardian", async function () {
        const sender = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        const guardian = Address.newFromBech32("erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx");
        const serviceID = "MultiversXTCSService";

        const transaction = factory.createTransactionForSettingGuardian(sender, {
            guardianAddress: guardian,
            serviceID: serviceID,
        });

        assert.deepEqual(
            transaction.sender,
            Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
        );
        assert.deepEqual(
            transaction.receiver,
            Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
        );
        assert.equal(
            Buffer.from(transaction.data).toString(),
            "SetGuardian@8049d639e5a6980d1cd2392abcce41029cda74a1563523a202f09641cc2618f8@4d756c7469766572735854435353657276696365",
        );
        assert.equal(transaction.value, 0n);
        assert.equal(transaction.chainID, config.chainID);
        assert.equal(transaction.gasLimit, 475500n);
    });

    it("should create 'Transaction' for guarding account", async function () {
        const sender = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");

        const transaction = factory.createTransactionForGuardingAccount(sender);

        assert.deepEqual(
            transaction.sender,
            Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
        );
        assert.deepEqual(
            transaction.receiver,
            Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
        );
        assert.equal(Buffer.from(transaction.data).toString(), "GuardAccount");
        assert.equal(transaction.value, 0n);
        assert.equal(transaction.chainID, config.chainID);
        assert.equal(transaction.gasLimit, 318000n);
    });

    it("should create 'Transaction' for unguarding account", async function () {
        const sender = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");

        const transaction = factory.createTransactionForUnguardingAccount(sender);

        assert.deepEqual(
            transaction.sender,
            Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
        );
        assert.deepEqual(
            transaction.receiver,
            Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
        );
        assert.equal(Buffer.from(transaction.data).toString(), "UnGuardAccount");
        assert.equal(transaction.value, 0n);
        assert.equal(transaction.chainID, config.chainID);
        assert.equal(transaction.gasLimit, 321000n);
    });
});
