import BigNumber from "bignumber.js";
import { Address } from "../address";
import { DelegationTransactionsFactory } from "./delegationTransactionsFactory";
import { assert } from "chai";
import { DELEGATION_MANAGER_SC_ADDRESS } from "../constants";
import { ValidatorPublicKey } from "@multiversx/sdk-wallet-next";
import { TransactionsFactoryConfig } from "./transactionsFactoryConfig";

describe("test delegation transactions factory", function () {
    const config = new TransactionsFactoryConfig("D");
    const delegationFactory = new DelegationTransactionsFactory(config);

    it("should create draft transaction for new delegation contract", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delagationCap = "5000000000000000000000";
        const serviceFee = 10;
        const value = new BigNumber("1250000000000000000000");

        const draft = delegationFactory.createTransactionForNewDelegationContract({
            sender: sender,
            totalDelegationCap: delagationCap,
            serviceFee: serviceFee,
            amount: value
        });

        assert.equal(draft.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(draft.receiver, DELEGATION_MANAGER_SC_ADDRESS);
        assert.isDefined(draft.data);
        assert.deepEqual(draft.data, Buffer.from("createNewDelegationContract@010f0cf064dd59200000@0a"));
        assert.equal(draft.gasLimit.valueOf(), 60126500);
        assert.equal(draft.value, value);
    });

    it("should create draft transaction for adding nodes", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        const publicKey = new ValidatorPublicKey(Buffer.from("e7beaa95b3877f47348df4dd1cb578a4f7cabf7a20bfeefe5cdd263878ff132b765e04fef6f40c93512b666c47ed7719b8902f6c922c04247989b7137e837cc81a62e54712471c97a2ddab75aa9c2f58f813ed4c0fa722bde0ab718bff382208", "hex"));

        const mockMessage = {
            getSignature: () => Buffer.from("81109fa1c8d3dc7b6c2d6e65206cc0bc1a83c9b2d1eb91a601d66ad32def430827d5eb52917bd2b0d04ce195738db216", "hex")
        }

        const draft = delegationFactory.createTransactionForAddingNodes({
            sender: sender,
            delegationContract: delegationContract,
            publicKeys: [publicKey],
            signedMessages: [mockMessage.getSignature()]
        });

        assert.equal(draft.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(draft.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(draft.data);
        assert.deepEqual(draft.data, Buffer.from("addNodes@e7beaa95b3877f47348df4dd1cb578a4f7cabf7a20bfeefe5cdd263878ff132b765e04fef6f40c93512b666c47ed7719b8902f6c922c04247989b7137e837cc81a62e54712471c97a2ddab75aa9c2f58f813ed4c0fa722bde0ab718bff382208@81109fa1c8d3dc7b6c2d6e65206cc0bc1a83c9b2d1eb91a601d66ad32def430827d5eb52917bd2b0d04ce195738db216"));
        assert.equal(draft.value, 0);
    });

    it("should create draft transaction for removing nodes", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");

        const publicKey = {
            hex(): string {
                return Buffer.from("abba").toString("hex");
            }
        };

        const draft = delegationFactory.createTransactionForRemovingNodes({
            sender: sender,
            delegationContract: delegationContract,
            publicKeys: [publicKey]
        });

        assert.equal(draft.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(draft.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(draft.data);
        assert.deepEqual(draft.data, Buffer.from("removeNodes@61626261"));
        assert.equal(draft.value, 0);
    });

    it("should create draft transaction for staking nodes", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");

        const publicKey = {
            hex(): string {
                return Buffer.from("abba").toString("hex");
            }
        };

        const draft = delegationFactory.createTransactionForStakingNodes({
            sender: sender,
            delegationContract: delegationContract,
            publicKeys: [publicKey]
        });

        assert.equal(draft.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(draft.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(draft.data);
        assert.deepEqual(draft.data, Buffer.from("stakeNodes@61626261"));
        assert.equal(draft.value, 0);
    });

    it("should create draft transaction for unbonding nodes", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");

        const publicKey = {
            hex(): string {
                return Buffer.from("abba").toString("hex");
            }
        };

        const draft = delegationFactory.createTransactionForUnbondingNodes({
            sender: sender,
            delegationContract: delegationContract,
            publicKeys: [publicKey]
        });

        assert.equal(draft.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(draft.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(draft.data);
        assert.deepEqual(draft.data, Buffer.from("unBondNodes@61626261"));
        assert.equal(draft.value, 0);
        assert.equal(draft.gasLimit.valueOf(), 12080000);
    });

    it("should create draft transaction for unstaking nodes", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");

        const publicKey = {
            hex(): string {
                return Buffer.from("abba").toString("hex");
            }
        };

        const draft = delegationFactory.createTransactionForUnstakingNodes({
            sender: sender,
            delegationContract: delegationContract,
            publicKeys: [publicKey]
        });

        assert.equal(draft.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(draft.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(draft.data);
        assert.deepEqual(draft.data, Buffer.from("unStakeNodes@61626261"));
        assert.equal(draft.value, 0);
        assert.equal(draft.gasLimit.valueOf(), 12081500);
    });

    it("should create draft transaction for unjailing nodes", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");

        const publicKey = {
            hex(): string {
                return Buffer.from("abba").toString("hex");
            }
        };

        const draft = delegationFactory.createTransactionForUnjailingNodes({
            sender: sender,
            delegationContract: delegationContract,
            publicKeys: [publicKey]
        });

        assert.equal(draft.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(draft.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(draft.data);
        assert.deepEqual(draft.data, Buffer.from("unJailNodes@61626261"));
        assert.equal(draft.value, 0);
    });

    it("should create draft transaction for changing service fee", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        const serviceFee = new BigNumber(10);

        const draft = delegationFactory.createTransactionForChangingServiceFee({
            sender: sender,
            delegationContract: delegationContract,
            serviceFee: serviceFee
        });

        assert.equal(draft.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(draft.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(draft.data);
        assert.deepEqual(draft.data, Buffer.from("changeServiceFee@0a"));
        assert.equal(draft.value, 0);
    });

    it("should create draft transaction for changing delegation cap", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        const delegationCap = new BigNumber("5000000000000000000000");

        const draft = delegationFactory.createTransactionForModifyingDelegationCap({
            sender: sender,
            delegationContract: delegationContract,
            delegationCap: delegationCap
        });

        assert.equal(draft.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(draft.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(draft.data);
        assert.deepEqual(draft.data, Buffer.from("modifyTotalDelegationCap@010f0cf064dd59200000"));
        assert.equal(draft.value, 0);
    });

    it("should create draft transaction for setting automatic activation", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");

        const draft = delegationFactory.createTransactionForSettingAutomaticActivation({
            sender: sender,
            delegationContract: delegationContract
        });

        assert.equal(draft.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(draft.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(draft.data);
        assert.deepEqual(draft.data, Buffer.from("setAutomaticActivation@74727565"));
        assert.equal(draft.value, 0);
    });

    it("should create draft transaction for unsetting automatic activation", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");

        const draft = delegationFactory.createTransactionForUnsettingAutomaticActivation({
            sender: sender,
            delegationContract: delegationContract
        });

        assert.equal(draft.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(draft.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(draft.data);
        assert.deepEqual(draft.data, Buffer.from("setAutomaticActivation@66616c7365"));
        assert.equal(draft.value, 0);
    });

    it("should create draft transaction for setting cap check on redelegate rewards", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");

        const draft = delegationFactory.createTransactionForSettingCapCheckOnRedelegateRewards({
            sender: sender,
            delegationContract: delegationContract
        });

        assert.equal(draft.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(draft.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(draft.data);
        assert.deepEqual(draft.data, Buffer.from("setCheckCapOnReDelegateRewards@74727565"));
        assert.equal(draft.value, 0);
    });

    it("should create draft transaction for unsetting cap check on redelegate rewards", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");

        const draft = delegationFactory.createTransactionForUnsettingCapCheckOnRedelegateRewards({
            sender: sender,
            delegationContract: delegationContract
        });

        assert.equal(draft.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(draft.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(draft.data);
        assert.deepEqual(draft.data, Buffer.from("setCheckCapOnReDelegateRewards@66616c7365"));
        assert.equal(draft.value, 0);
    });

    it("should create draft transaction for setting metadata", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");

        const draft = delegationFactory.createTransactionForSettingMetadata({
            sender: sender,
            delegationContract: delegationContract,
            name: "name",
            website: "website",
            identifier: "identifier"
        });

        assert.equal(draft.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(draft.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(draft.data);
        assert.deepEqual(draft.data, Buffer.from("setMetaData@6e616d65@77656273697465@6964656e746966696572"));
        assert.equal(draft.value, 0);
    });
});
