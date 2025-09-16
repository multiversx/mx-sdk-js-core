import { assert } from "chai";
import { TransactionsFactoryConfig } from "../core";
import { Address } from "../core/address";
import { DELEGATION_MANAGER_SC_ADDRESS_HEX, STAKING_SMART_CONTRACT_ADDRESS_HEX } from "../core/constants";
import { getTestWalletsPath } from "../testutils";
import { ValidatorPublicKey } from "../wallet";
import { ValidatorsSigners } from "./validatorsSigner";
import { ValidatorsTransactionsFactory } from "./validatorsTransactionsFactory";

describe("test delegation transactions factory", function () {
    const config = new TransactionsFactoryConfig({ chainID: "D" });
    const validatorsFactory = new ValidatorsTransactionsFactory({ config: config });
    const validatorsPath = `${getTestWalletsPath()}/validators.pem`;
    const alice = Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
    const rewardAddress = Address.newFromBech32("erd1k2s324ww2g0yj38qn2ch2jwctdy8mnfxep94q9arncc6xecg3xaq6mjse8");
    const validatorPubkey = new ValidatorPublicKey(
        Buffer.from(
            "e7beaa95b3877f47348df4dd1cb578a4f7cabf7a20bfeefe5cdd263878ff132b765e04fef6f40c93512b666c47ed7719b8902f6c922c04247989b7137e837cc81a62e54712471c97a2ddab75aa9c2f58f813ed4c0fa722bde0ab718bff382208",
            "hex",
        ),
    );

    it("should create 'Transaction' for staking from file path", async function () {
        const transaction = await validatorsFactory.createTransactionForStaking(alice, {
            validatorsFile: validatorsPath,
            amount: 2500000000000000000000n,
            rewardsAddress: rewardAddress,
        });

        assert.deepEqual(
            transaction.sender,
            Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
        );
        assert.deepEqual(transaction.receiver, Address.newFromHex(STAKING_SMART_CONTRACT_ADDRESS_HEX));
        assert.equal(transaction.value, 2500000000000000000000n);
        assert.equal(transaction.chainID, "D");
        assert.equal(transaction.version, 2);
        assert.equal(transaction.gasLimit, 11029500n);
        assert.equal(transaction.options, 0);
        assert.deepEqual(
            Buffer.from(transaction.data).toString(),
            "stake@02@f8910e47cf9464777c912e6390758bb39715fffcb861b184017920e4a807b42553f2f21e7f3914b81bcf58b66a72ab16d97013ae1cff807cefc977ef8cbf116258534b9e46d19528042d16ef8374404a89b184e0a4ee18c77c49e454d04eae8d@1865870f7f69162a2dfefd33fe232a9ca984c6f22d1ee3f6a5b34a8eb8c9f7319001f29d5a2eed85c1500aca19fa4189@1b4e60e6d100cdf234d3427494dac55fbac49856cadc86bcb13a01b9bb05a0d9143e86c186c948e7ae9e52427c9523102efe9019a2a9c06db02993f2e3e6756576ae5a3ec7c235d548bc79de1a6990e1120ae435cb48f7fc436c9f9098b92a0d@12b309791213aac8ad9f34f0d912261e30f9ab060859e4d515e020a98b91d82a7cd334e4b504bb93d6b75347cccd6318@b2a11555ce521e4944e09ab17549d85b487dcd26c84b5017a39e31a3670889ba",
        );
    });

    it("should create 'Transaction' for staking using validators file", async function () {
        const validatorsFile = await ValidatorsSigners.newFromPem(validatorsPath);
        const transaction = await validatorsFactory.createTransactionForStaking(alice, {
            validatorsFile: validatorsFile,
            amount: 2500000000000000000000n,
            rewardsAddress: rewardAddress,
        });

        assert.deepEqual(
            transaction.sender.toBech32(),
            "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        );
        assert.deepEqual(transaction.receiver, Address.newFromHex(STAKING_SMART_CONTRACT_ADDRESS_HEX));
        assert.equal(transaction.value, 2500000000000000000000n);
        assert.equal(transaction.chainID, "D");
        assert.equal(transaction.version, 2);
        assert.equal(transaction.gasLimit, 11029500n);
        assert.equal(transaction.options, 0);
        assert.deepEqual(
            Buffer.from(transaction.data).toString(),
            "stake@02@f8910e47cf9464777c912e6390758bb39715fffcb861b184017920e4a807b42553f2f21e7f3914b81bcf58b66a72ab16d97013ae1cff807cefc977ef8cbf116258534b9e46d19528042d16ef8374404a89b184e0a4ee18c77c49e454d04eae8d@1865870f7f69162a2dfefd33fe232a9ca984c6f22d1ee3f6a5b34a8eb8c9f7319001f29d5a2eed85c1500aca19fa4189@1b4e60e6d100cdf234d3427494dac55fbac49856cadc86bcb13a01b9bb05a0d9143e86c186c948e7ae9e52427c9523102efe9019a2a9c06db02993f2e3e6756576ae5a3ec7c235d548bc79de1a6990e1120ae435cb48f7fc436c9f9098b92a0d@12b309791213aac8ad9f34f0d912261e30f9ab060859e4d515e020a98b91d82a7cd334e4b504bb93d6b75347cccd6318@b2a11555ce521e4944e09ab17549d85b487dcd26c84b5017a39e31a3670889ba",
        );
    });

    it("should create 'Transaction' for topping up", async function () {
        const transaction = await validatorsFactory.createTransactionForToppingUp(alice, {
            amount: 2500000000000000000000n,
        });

        assert.equal(transaction.sender.toBech32(), "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th");
        assert.deepEqual(transaction.receiver, Address.newFromHex(STAKING_SMART_CONTRACT_ADDRESS_HEX));
        assert.equal(transaction.value, 2500000000000000000000n);
        assert.equal(transaction.chainID, "D");
        assert.equal(transaction.gasLimit, 5057500n);
        assert.equal(transaction.version, 2);
        assert.equal(transaction.options, 0);
        assert.deepEqual(Buffer.from(transaction.data).toString(), "stake");
    });

    it("should create 'Transaction' for unstake", async function () {
        const transaction = await validatorsFactory.createTransactionForUnstaking(alice, {
            publicKeys: [validatorPubkey],
        });

        assert.deepEqual(
            transaction.sender.toBech32(),
            "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        );
        assert.deepEqual(transaction.receiver, Address.newFromHex(STAKING_SMART_CONTRACT_ADDRESS_HEX));
        assert.equal(transaction.value, 0n);
        assert.equal(transaction.chainID, "D");
        assert.equal(transaction.gasLimit, 5350000n);
        assert.equal(transaction.version, 2);
        assert.equal(transaction.options, 0);
        assert.deepEqual(
            Buffer.from(transaction.data).toString(),
            "unStake@e7beaa95b3877f47348df4dd1cb578a4f7cabf7a20bfeefe5cdd263878ff132b765e04fef6f40c93512b666c47ed7719b8902f6c922c04247989b7137e837cc81a62e54712471c97a2ddab75aa9c2f58f813ed4c0fa722bde0ab718bff382208",
        );
    });

    it("should create 'Transaction' for unjail", async function () {
        const transaction = await validatorsFactory.createTransactionForUnjailing(alice, {
            publicKeys: [validatorPubkey],
            amount: 2500000000000000000000n,
        });

        assert.deepEqual(
            transaction.sender.toBech32(),
            "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        );
        assert.deepEqual(transaction.receiver, Address.newFromHex(STAKING_SMART_CONTRACT_ADDRESS_HEX));
        assert.equal(transaction.value, 0n);
        assert.equal(transaction.chainID, "D");
        assert.equal(transaction.gasLimit, 5348500n);
        assert.equal(transaction.version, 2);
        assert.equal(transaction.options, 0);
        assert.deepEqual(
            Buffer.from(transaction.data).toString(),
            "unJail@e7beaa95b3877f47348df4dd1cb578a4f7cabf7a20bfeefe5cdd263878ff132b765e04fef6f40c93512b666c47ed7719b8902f6c922c04247989b7137e837cc81a62e54712471c97a2ddab75aa9c2f58f813ed4c0fa722bde0ab718bff382208",
        );
    });

    it("should create 'Transaction' for changing rewards address", async function () {
        const transaction = await validatorsFactory.createTransactionForChangingRewardsAddress(alice, {
            rewardsAddress: rewardAddress,
        });

        assert.deepEqual(
            transaction.sender,
            Address.newFromBech32("erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th"),
        );
        assert.deepEqual(transaction.receiver, Address.newFromHex(STAKING_SMART_CONTRACT_ADDRESS_HEX));
        assert.isDefined(transaction.data);
        assert.deepEqual(
            Buffer.from(transaction.data).toString(),
            "changeRewardAddress@b2a11555ce521e4944e09ab17549d85b487dcd26c84b5017a39e31a3670889ba",
        );
        assert.equal(transaction.value, 0n);
    });

    it("should create 'Transaction' for claiming", async function () {
        const transaction = await validatorsFactory.createTransactionForClaiming(alice);

        assert.deepEqual(
            transaction.sender.toBech32(),
            "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        );
        assert.deepEqual(transaction.receiver, Address.newFromHex(STAKING_SMART_CONTRACT_ADDRESS_HEX));
        assert.equal(transaction.value, 0n);
        assert.equal(transaction.chainID, "D");
        assert.equal(transaction.gasLimit, 5057500n);
        assert.equal(transaction.version, 2);
        assert.equal(transaction.options, 0);
        assert.deepEqual(Buffer.from(transaction.data).toString(), "claim");
    });

    it("should create 'Transaction' for unstaking nodes", async function () {
        const transaction = await validatorsFactory.createTransactionForUnstakingNodes(alice, {
            publicKeys: [validatorPubkey],
        });

        assert.deepEqual(
            transaction.sender.toBech32(),
            "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        );
        assert.deepEqual(transaction.receiver, Address.newFromHex(STAKING_SMART_CONTRACT_ADDRESS_HEX));
        assert.equal(transaction.value, 0n);
        assert.equal(transaction.chainID, "D");
        assert.equal(transaction.gasLimit, 5357500n);
        assert.equal(transaction.version, 2);
        assert.equal(transaction.options, 0);
        assert.deepEqual(
            Buffer.from(transaction.data).toString(),
            "unStakeNodes@e7beaa95b3877f47348df4dd1cb578a4f7cabf7a20bfeefe5cdd263878ff132b765e04fef6f40c93512b666c47ed7719b8902f6c922c04247989b7137e837cc81a62e54712471c97a2ddab75aa9c2f58f813ed4c0fa722bde0ab718bff382208",
        );
    });

    it("should create 'Transaction' for unstaking tokens", async function () {
        const transaction = await validatorsFactory.createTransactionForUnstakingTokens(alice, {
            amount: 11000000000000000000n,
        });

        assert.deepEqual(
            transaction.sender.toBech32(),
            "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        );
        assert.deepEqual(transaction.receiver, Address.newFromHex(STAKING_SMART_CONTRACT_ADDRESS_HEX));
        assert.equal(transaction.value, 0n);
        assert.equal(transaction.chainID, "D");
        assert.equal(transaction.gasLimit, 5095000n);
        assert.equal(transaction.version, 2);
        assert.equal(transaction.options, 0);
        assert.deepEqual(Buffer.from(transaction.data).toString(), "unStakeTokens@98a7d9b8314c0000");
    });

    it("should create 'Transaction' for unbounding nodes", async function () {
        const transaction = await validatorsFactory.createTransactionForUnboundingNodes(alice, {
            publicKeys: [validatorPubkey],
        });

        assert.deepEqual(
            transaction.sender.toBech32(),
            "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        );
        assert.deepEqual(transaction.receiver, Address.newFromHex(STAKING_SMART_CONTRACT_ADDRESS_HEX));
        assert.equal(transaction.value, 0n);
        assert.equal(transaction.chainID, "D");
        assert.equal(transaction.gasLimit, 5356000n);
        assert.equal(transaction.version, 2);
        assert.equal(transaction.options, 0);
        assert.deepEqual(
            Buffer.from(transaction.data).toString(),
            "unBondNodes@e7beaa95b3877f47348df4dd1cb578a4f7cabf7a20bfeefe5cdd263878ff132b765e04fef6f40c93512b666c47ed7719b8902f6c922c04247989b7137e837cc81a62e54712471c97a2ddab75aa9c2f58f813ed4c0fa722bde0ab718bff382208",
        );
    });

    it("should create 'Transaction' for unbounding tokens", async function () {
        const transaction = await validatorsFactory.createTransactionForUnboundingTokens(alice, {
            amount: 20000000000000000000n,
        });

        assert.deepEqual(
            transaction.sender.toBech32(),
            "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        );
        assert.deepEqual(transaction.receiver, Address.newFromHex(STAKING_SMART_CONTRACT_ADDRESS_HEX));
        assert.equal(transaction.value, 0n);
        assert.equal(transaction.chainID, "D");
        assert.equal(transaction.gasLimit, 5096500n);
        assert.equal(transaction.version, 2);
        assert.equal(transaction.options, 0);
        assert.deepEqual(Buffer.from(transaction.data).toString(), "unBondTokens@01158e460913d00000");
    });

    it("should create 'Transaction' for cleaning registered data", async function () {
        const transaction = await validatorsFactory.createTransactionForCleaningRegisteredData(alice);

        assert.deepEqual(
            transaction.sender.toBech32(),
            "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        );
        assert.deepEqual(transaction.receiver, Address.newFromHex(STAKING_SMART_CONTRACT_ADDRESS_HEX));
        assert.equal(transaction.value, 0n);
        assert.equal(transaction.chainID, "D");
        assert.equal(transaction.gasLimit, 5078500n);
        assert.equal(transaction.version, 2);
        assert.equal(transaction.options, 0);
        assert.deepEqual(Buffer.from(transaction.data).toString(), "cleanRegisteredData");
    });

    it("should create 'Transaction' for restaking unstaked nodes", async function () {
        const transaction = await validatorsFactory.createTransactionForRestakingUnstakedNodes(alice, {
            publicKeys: [validatorPubkey],
        });

        assert.deepEqual(
            transaction.sender.toBech32(),
            "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        );
        assert.deepEqual(transaction.receiver, Address.newFromHex(STAKING_SMART_CONTRACT_ADDRESS_HEX));
        assert.equal(transaction.value, 0n);
        assert.equal(transaction.chainID, "D");
        assert.equal(transaction.gasLimit, 5369500n);
        assert.equal(transaction.version, 2);
        assert.equal(transaction.options, 0);
        assert.deepEqual(
            Buffer.from(transaction.data).toString(),
            "reStakeUnStakedNodes@e7beaa95b3877f47348df4dd1cb578a4f7cabf7a20bfeefe5cdd263878ff132b765e04fef6f40c93512b666c47ed7719b8902f6c922c04247989b7137e837cc81a62e54712471c97a2ddab75aa9c2f58f813ed4c0fa722bde0ab718bff382208",
        );
    });

    it("should create 'Transaction' for new delegation contract from validator", async function () {
        const transaction = await validatorsFactory.createTransactionForNewDelegationContractFromValidatorData(alice, {
            maxCap: 0n,
            fee: 3745n,
        });

        assert.deepEqual(
            transaction.sender.toBech32(),
            "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        );
        assert.deepEqual(transaction.receiver, Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX));
        assert.equal(transaction.value, 0n);
        assert.equal(transaction.chainID, "D");
        assert.equal(transaction.gasLimit, 51107000n);
        assert.equal(transaction.version, 2);
        assert.equal(transaction.options, 0);
        assert.deepEqual(Buffer.from(transaction.data).toString(), "makeNewContractFromValidatorData@@0ea1");
    });

    it("should create 'Transaction' for merging validator to delegation whitelisting", async function () {
        const delegationContract = Address.newFromBech32(
            "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc",
        );

        const transaction = await validatorsFactory.createTransactionForMergingValidatorToDelegationWithWhitelist(
            alice,
            {
                delegationAddress: delegationContract,
            },
        );

        assert.deepEqual(
            transaction.sender.toBech32(),
            "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        );
        assert.deepEqual(transaction.receiver, Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX));
        assert.equal(transaction.value, 0n);
        assert.equal(transaction.chainID, "D");
        assert.equal(transaction.gasLimit, 5206000n);
        assert.equal(transaction.version, 2);
        assert.equal(transaction.options, 0);
        assert.deepEqual(
            Buffer.from(transaction.data).toString(),
            "mergeValidatorToDelegationWithWhitelist@000000000000000000010000000000000000000000000000000000002fffffff",
        );
    });

    it("should create 'Transaction' for merging validator to delegation same owner", async function () {
        const delegationContract = Address.newFromBech32(
            "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc",
        );

        const transaction = await validatorsFactory.createTransactionForMergingValidatorToDelegationSameOwner(alice, {
            delegationAddress: delegationContract,
        });

        assert.deepEqual(
            transaction.sender.toBech32(),
            "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
        );
        assert.deepEqual(transaction.receiver, Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX));
        assert.equal(transaction.value, 0n);
        assert.equal(transaction.chainID, "D");
        assert.equal(transaction.gasLimit, 50200000n);
        assert.equal(transaction.version, 2);
        assert.equal(transaction.options, 0);
        assert.deepEqual(
            Buffer.from(transaction.data).toString(),
            "mergeValidatorToDelegationSameOwner@000000000000000000010000000000000000000000000000000000002fffffff",
        );
    });
});
