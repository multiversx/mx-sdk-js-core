import BigNumber from "bignumber.js";
import { Address } from "../address";
import { DelegationTransactionIntentsFactory } from "./delegationTransactionIntentsFactory";
import { assert } from "chai";
import { DELEGATION_MANAGER_SC_ADDRESS } from "../constants";
import { ValidatorPublicKey } from "@multiversx/sdk-wallet-next";
import { SignableMessage } from "../signableMessage";

describe("test delegation intents factory", function () {
    const delegationFactory = new DelegationTransactionIntentsFactory({
        chainID: "D",
        minGasLimit: 50000,
        gasLimitPerByte: 1500,
        gasLimitStake: 5000000,
        gasLimitUnstake: 5000000,
        gasLimitUnbond: 5000000,
        gasLimitCreateDelegationContract: 50000000,
        gasLimitDelegationOperations: 1000000,
        additionalGasLimitPerValidatorNode: 6000000,
        additionalGasLimitForDelegationOperations: 10000000
    });

    it("should build intent for new delegation contract", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delagationCap = new BigNumber("5000000000000000000000");
        const serviceFee = new BigNumber(10);
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

        let decoder = new TextDecoder();
        assert.equal(decoder.decode(intent.data), "createNewDelegationContract@010f0cf064dd59200000@0a");

        assert.equal(intent.gasLimit.valueOf(), 60126500);
        assert.equal(intent.value, value);
    });

    it("should build intent for adding nodes", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        const publicKey = new ValidatorPublicKey(Buffer.from("e7beaa95b3877f47348df4dd1cb578a4f7cabf7a20bfeefe5cdd263878ff132b765e04fef6f40c93512b666c47ed7719b8902f6c922c04247989b7137e837cc81a62e54712471c97a2ddab75aa9c2f58f813ed4c0fa722bde0ab718bff382208", "hex"));

        const signedMessage = new SignableMessage();
        signedMessage.applySignature(Buffer.from("81109fa1c8d3dc7b6c2d6e65206cc0bc1a83c9b2d1eb91a601d66ad32def430827d5eb52917bd2b0d04ce195738db216", "hex"));

        const intent = delegationFactory.createTransactionIntentForAddingNodes({
            sender: sender,
            delegationContract: delegationContract,
            publicKeys: [publicKey],
            signedMessages: [signedMessage.getSignature()]
        });

        assert.equal(intent.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(intent.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(intent.data);

        let decoder = new TextDecoder();
        assert.equal(decoder.decode(intent.data), "addNodes@e7beaa95b3877f47348df4dd1cb578a4f7cabf7a20bfeefe5cdd263878ff132b765e04fef6f40c93512b666c47ed7719b8902f6c922c04247989b7137e837cc81a62e54712471c97a2ddab75aa9c2f58f813ed4c0fa722bde0ab718bff382208@81109fa1c8d3dc7b6c2d6e65206cc0bc1a83c9b2d1eb91a601d66ad32def430827d5eb52917bd2b0d04ce195738db216");

        assert.equal(intent.value, 0);
    });

    it("should build intent for removing nodes", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");

        const publicKey = {
            hex(): string {
                return Buffer.from("notavalidblskeyhexencoded").toString("hex");
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

        let decoder = new TextDecoder();
        assert.equal(decoder.decode(intent.data), "removeNodes@6e6f746176616c6964626c736b6579686578656e636f646564");

        assert.equal(intent.value, 0);
    });

    it("should build intent for staking nodes", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");

        const publicKey = {
            hex(): string {
                return Buffer.from("notavalidblskeyhexencoded").toString("hex");
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

        let decoder = new TextDecoder();
        assert.equal(decoder.decode(intent.data), "stakeNodes@6e6f746176616c6964626c736b6579686578656e636f646564");

        assert.equal(intent.value, 0);
    });

    it("should build intent for unbonding nodes", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");

        const publicKey = {
            hex(): string {
                return Buffer.from("notavalidblskeyhexencoded").toString("hex");
            }
        };

        const intent = delegationFactory.createTransactionIntentForUnbondingNodes(
            sender,
            delegationContract,
            [publicKey]
        );

        assert.equal(intent.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(intent.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(intent.data);

        let decoder = new TextDecoder();
        assert.equal(decoder.decode(intent.data), "unBondNodes@6e6f746176616c6964626c736b6579686578656e636f646564");

        assert.equal(intent.value, 0);
        assert.equal(intent.gasLimit.valueOf(), 12143000);
    });

    it("should build intent for unstaking nodes", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");

        const publicKey = {
            hex(): string {
                return Buffer.from("notavalidblskeyhexencoded").toString("hex");
            }
        };

        const intent = delegationFactory.createTransactionIntentForUnstakingNodes(
            sender,
            delegationContract,
            [publicKey]
        );

        assert.equal(intent.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(intent.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(intent.data);

        let decoder = new TextDecoder();
        assert.equal(decoder.decode(intent.data), "unStakeNodes@6e6f746176616c6964626c736b6579686578656e636f646564");

        assert.equal(intent.value, 0);
        assert.equal(intent.gasLimit.valueOf(), 12144500);
    });

    it("should build intent for unjailing nodes", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");

        const publicKey = {
            hex(): string {
                return Buffer.from("notavalidblskeyhexencoded").toString("hex");
            }
        };

        const intent = delegationFactory.createTransactionIntentForUnjailingNodes(
            sender,
            delegationContract,
            [publicKey]
        );

        assert.equal(intent.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(intent.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(intent.data);

        let decoder = new TextDecoder();
        assert.equal(decoder.decode(intent.data), "unJailNodes@6e6f746176616c6964626c736b6579686578656e636f646564");

        assert.equal(intent.value, 0);
    });

    it("should build intent for changing service fee", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        const serviceFee = new BigNumber(10);

        const intent = delegationFactory.createTransactionIntentForChangingServiceFee(
            sender,
            delegationContract,
            serviceFee
        );

        assert.equal(intent.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(intent.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(intent.data);

        let decoder = new TextDecoder();
        assert.equal(decoder.decode(intent.data), "changeServiceFee@0a");

        assert.equal(intent.value, 0);
    });

    it("should build intent for changing delegation cap", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        const delegationCap = new BigNumber("5000000000000000000000");

        const intent = delegationFactory.createTransactionIntentForModifyingDelegationCap(
            sender,
            delegationContract,
            delegationCap
        );

        assert.equal(intent.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(intent.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(intent.data);

        let decoder = new TextDecoder();
        assert.equal(decoder.decode(intent.data), "modifyTotalDelegationCap@010f0cf064dd59200000");

        assert.equal(intent.value, 0);
    });

    it("should build intent for setting automatic activation", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");

        const intent = delegationFactory.createTransactionIntentForSettingAutomaticActivation(
            sender,
            delegationContract
        );

        assert.equal(intent.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(intent.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(intent.data);

        let decoder = new TextDecoder();
        assert.equal(decoder.decode(intent.data), "setAutomaticActivation@74727565");

        assert.equal(intent.value, 0);
    });

    it("should build intent for unsetting automatic activation", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");

        const intent = delegationFactory.createTransactionIntentForUnsettingAutomaticActivation(
            sender,
            delegationContract
        );

        assert.equal(intent.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(intent.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(intent.data);

        let decoder = new TextDecoder();
        assert.equal(decoder.decode(intent.data), "setAutomaticActivation@66616c7365");

        assert.equal(intent.value, 0);
    });

    it("should build intent for setting cap check on redelegate rewards", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");

        const intent = delegationFactory.createTransactionIntentForSettingCapCheckOnRedelegateRewards(
            sender,
            delegationContract
        );

        assert.equal(intent.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(intent.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(intent.data);

        let decoder = new TextDecoder();
        assert.equal(decoder.decode(intent.data), "setCheckCapOnReDelegateRewards@74727565");

        assert.equal(intent.value, 0);
    });

    it("should build intent for unsetting cap check on redelegate rewards", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");

        const intent = delegationFactory.createTransactionIntentForUnsettingCapCheckOnRedelegateRewards(
            sender,
            delegationContract
        );

        assert.equal(intent.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(intent.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(intent.data);

        let decoder = new TextDecoder();
        assert.equal(decoder.decode(intent.data), "setCheckCapOnReDelegateRewards@66616c7365");

        assert.equal(intent.value, 0);
    });

    it("should build intent for setting metadata", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");

        const intent = delegationFactory.createTransactionIntentForSettingMetadata(
            sender,
            delegationContract,
            "name",
            "website",
            "identifier"
        );

        assert.equal(intent.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(intent.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(intent.data);

        let decoder = new TextDecoder();
        assert.equal(decoder.decode(intent.data), "setMetaData@6e616d65@77656273697465@6964656e746966696572");

        assert.equal(intent.value, 0);
    });
});
