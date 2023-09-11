import BigNumber from "bignumber.js";
import { Address } from "../address";
import { DelegationTransactionIntentsFactory } from "./delegationTransactionIntentsFactory";
import { assert } from "chai";
import { DELEGATION_MANAGER_SC_ADDRESS } from "../constants";
import { ValidatorPublicKey } from "@multiversx/sdk-wallet-next";
import { TransactionIntentsFactoryConfig } from "./transactionIntentsFactoryConfig";

describe("test delegation intents factory", function () {
    const config = new TransactionIntentsFactoryConfig("D");
    const delegationFactory = new DelegationTransactionIntentsFactory(config);

    it("should create intent for new delegation contract", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delagationCap = "5000000000000000000000";
        const serviceFee = 10;
        const value = new BigNumber("1250000000000000000000");

        const intent = delegationFactory.createTransactionIntentForNewDelegationContract({
            sender: sender,
            totalDelegationCap: delagationCap,
            serviceFee: serviceFee,
            value: value
        });

        assert.equal(intent.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(intent.receiver, DELEGATION_MANAGER_SC_ADDRESS);
        assert.isDefined(intent.data);
        assert.deepEqual(intent.data, Buffer.from("createNewDelegationContract@010f0cf064dd59200000@0a"));
        assert.equal(intent.gasLimit.valueOf(), 60126500);
        assert.equal(intent.value, value);
    });

    it("should create intent for adding nodes", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        const publicKey = new ValidatorPublicKey(Buffer.from("e7beaa95b3877f47348df4dd1cb578a4f7cabf7a20bfeefe5cdd263878ff132b765e04fef6f40c93512b666c47ed7719b8902f6c922c04247989b7137e837cc81a62e54712471c97a2ddab75aa9c2f58f813ed4c0fa722bde0ab718bff382208", "hex"));

        const mockMessage = {
            getSignature: () => Buffer.from("81109fa1c8d3dc7b6c2d6e65206cc0bc1a83c9b2d1eb91a601d66ad32def430827d5eb52917bd2b0d04ce195738db216", "hex")
        }

        const intent = delegationFactory.createTransactionIntentForAddingNodes({
            sender: sender,
            delegationContract: delegationContract,
            publicKeys: [publicKey],
            signedMessages: [mockMessage.getSignature()]
        });

        assert.equal(intent.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(intent.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(intent.data);
        assert.deepEqual(intent.data, Buffer.from("addNodes@e7beaa95b3877f47348df4dd1cb578a4f7cabf7a20bfeefe5cdd263878ff132b765e04fef6f40c93512b666c47ed7719b8902f6c922c04247989b7137e837cc81a62e54712471c97a2ddab75aa9c2f58f813ed4c0fa722bde0ab718bff382208@81109fa1c8d3dc7b6c2d6e65206cc0bc1a83c9b2d1eb91a601d66ad32def430827d5eb52917bd2b0d04ce195738db216"));
        assert.equal(intent.value, 0);
    });

    it("should create intent for removing nodes", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");

        const publicKey = {
            hex(): string {
                return Buffer.from("abba").toString("hex");
            }
        };

        const intent = delegationFactory.createTransactionIntentForRemovingNodes({
            sender: sender,
            delegationContract: delegationContract,
            publicKeys: [publicKey]
        });

        assert.equal(intent.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(intent.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(intent.data);
        assert.deepEqual(intent.data, Buffer.from("removeNodes@61626261"));
        assert.equal(intent.value, 0);
    });

    it("should create intent for staking nodes", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");

        const publicKey = {
            hex(): string {
                return Buffer.from("abba").toString("hex");
            }
        };

        const intent = delegationFactory.createTransactionIntentForStakingNodes({
            sender: sender,
            delegationContract: delegationContract,
            publicKeys: [publicKey]
        });

        assert.equal(intent.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(intent.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(intent.data);
        assert.deepEqual(intent.data, Buffer.from("stakeNodes@61626261"));
        assert.equal(intent.value, 0);
    });

    it("should create intent for unbonding nodes", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");

        const publicKey = {
            hex(): string {
                return Buffer.from("abba").toString("hex");
            }
        };

        const intent = delegationFactory.createTransactionIntentForUnbondingNodes({
            sender: sender,
            delegationContract: delegationContract,
            publicKeys: [publicKey]
        });

        assert.equal(intent.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(intent.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(intent.data);
        assert.deepEqual(intent.data, Buffer.from("unBondNodes@61626261"));
        assert.equal(intent.value, 0);
        assert.equal(intent.gasLimit.valueOf(), 12080000);
    });

    it("should create intent for unstaking nodes", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");

        const publicKey = {
            hex(): string {
                return Buffer.from("abba").toString("hex");
            }
        };

        const intent = delegationFactory.createTransactionIntentForUnstakingNodes({
            sender: sender,
            delegationContract: delegationContract,
            publicKeys: [publicKey]
        });

        assert.equal(intent.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(intent.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(intent.data);
        assert.deepEqual(intent.data, Buffer.from("unStakeNodes@61626261"));
        assert.equal(intent.value, 0);
        assert.equal(intent.gasLimit.valueOf(), 12081500);
    });

    it("should create intent for unjailing nodes", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");

        const publicKey = {
            hex(): string {
                return Buffer.from("abba").toString("hex");
            }
        };

        const intent = delegationFactory.createTransactionIntentForUnjailingNodes({
            sender: sender,
            delegationContract: delegationContract,
            publicKeys: [publicKey]
        });

        assert.equal(intent.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(intent.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(intent.data);
        assert.deepEqual(intent.data, Buffer.from("unJailNodes@61626261"));
        assert.equal(intent.value, 0);
    });

    it("should create intent for changing service fee", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        const serviceFee = new BigNumber(10);

        const intent = delegationFactory.createTransactionIntentForChangingServiceFee({
            sender: sender,
            delegationContract: delegationContract,
            serviceFee: serviceFee
        });

        assert.equal(intent.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(intent.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(intent.data);
        assert.deepEqual(intent.data, Buffer.from("changeServiceFee@0a"));
        assert.equal(intent.value, 0);
    });

    it("should create intent for changing delegation cap", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        const delegationCap = new BigNumber("5000000000000000000000");

        const intent = delegationFactory.createTransactionIntentForModifyingDelegationCap({
            sender: sender,
            delegationContract: delegationContract,
            delegationCap: delegationCap
        });

        assert.equal(intent.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(intent.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(intent.data);
        assert.deepEqual(intent.data, Buffer.from("modifyTotalDelegationCap@010f0cf064dd59200000"));
        assert.equal(intent.value, 0);
    });

    it("should create intent for setting automatic activation", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");

        const intent = delegationFactory.createTransactionIntentForSettingAutomaticActivation({
            sender: sender,
            delegationContract: delegationContract
        });

        assert.equal(intent.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(intent.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(intent.data);
        assert.deepEqual(intent.data, Buffer.from("setAutomaticActivation@74727565"));
        assert.equal(intent.value, 0);
    });

    it("should create intent for unsetting automatic activation", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");

        const intent = delegationFactory.createTransactionIntentForUnsettingAutomaticActivation({
            sender: sender,
            delegationContract: delegationContract
        });

        assert.equal(intent.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(intent.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(intent.data);
        assert.deepEqual(intent.data, Buffer.from("setAutomaticActivation@66616c7365"));
        assert.equal(intent.value, 0);
    });

    it("should create intent for setting cap check on redelegate rewards", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");

        const intent = delegationFactory.createTransactionIntentForSettingCapCheckOnRedelegateRewards({
            sender: sender,
            delegationContract: delegationContract
        });

        assert.equal(intent.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(intent.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(intent.data);
        assert.deepEqual(intent.data, Buffer.from("setCheckCapOnReDelegateRewards@74727565"));
        assert.equal(intent.value, 0);
    });

    it("should create intent for unsetting cap check on redelegate rewards", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");

        const intent = delegationFactory.createTransactionIntentForUnsettingCapCheckOnRedelegateRewards({
            sender: sender,
            delegationContract: delegationContract
        });

        assert.equal(intent.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(intent.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(intent.data);
        assert.deepEqual(intent.data, Buffer.from("setCheckCapOnReDelegateRewards@66616c7365"));
        assert.equal(intent.value, 0);
    });

    it("should create intent for setting metadata", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");

        const intent = delegationFactory.createTransactionIntentForSettingMetadata({
            sender: sender,
            delegationContract: delegationContract,
            name: "name",
            website: "website",
            identifier: "identifier"
        });

        assert.equal(intent.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(intent.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(intent.data);
        assert.deepEqual(intent.data, Buffer.from("setMetaData@6e616d65@77656273697465@6964656e746966696572"));
        assert.equal(intent.value, 0);
    });
});
