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

        const intent = delegationFactory.createTransactionIntentForNewDelegationContract(
            sender,
            delagationCap,
            serviceFee,
            value
        );

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

        const intent = delegationFactory.createTransactionIntentForAddingNodes(
            sender,
            delegationContract,
            [publicKey],
            [signedMessage.getSignature()]
        );

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

        const intent = delegationFactory.createTransactionIntentForRemovingNodes(
            sender,
            delegationContract,
            [publicKey]
        );

        assert.equal(intent.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(intent.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(intent.data);

        let decoder = new TextDecoder();
        assert.equal(decoder.decode(intent.data), "removeNodes@6e6f746176616c6964626c736b6579686578656e636f646564");

        assert.equal(intent.value, 0);
    });

    it.only("should build intent for staking nodes", async function () {
        const sender = Address.fromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.fromBech32("erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");

        const publicKey = {
            hex(): string {
                return Buffer.from("notavalidblskeyhexencoded").toString("hex");
            }
        };

        const intent = delegationFactory.createTransactionIntentForStakingNodes(
            sender,
            delegationContract,
            [publicKey]
        );

        assert.equal(intent.sender, "erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        assert.equal(intent.receiver, "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqtllllls002zgc");
        assert.isDefined(intent.data);

        let decoder = new TextDecoder();
        assert.equal(decoder.decode(intent.data), "stakeNodes@6e6f746176616c6964626c736b6579686578656e636f646564");

        assert.equal(intent.value, 0);
    });
});
