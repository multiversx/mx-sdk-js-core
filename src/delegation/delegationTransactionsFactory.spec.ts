import { assert } from "chai";
import { Address, TransactionsFactoryConfig } from "../core";
import { DELEGATION_MANAGER_SC_ADDRESS_HEX } from "../core/constants";
import { ValidatorPublicKey } from "../wallet";
import { DelegationTransactionsFactory } from "./delegationTransactionsFactory";

describe("test delegation transactions factory", function () {
    const config = new TransactionsFactoryConfig({ chainID: "D" });
    const delegationFactory = new DelegationTransactionsFactory({ config: config });

    it("should create 'Transaction' for new delegation contract", async function () {
        const sender = Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delagationCap = 5000000000000000000000n;
        const serviceFee = 10n;
        const value = 1250000000000000000000n;

        const transaction = delegationFactory.createTransactionForNewDelegationContract(sender, {
            totalDelegationCap: delagationCap,
            serviceFee: serviceFee,
            amount: value,
        });

        assert.deepEqual(
            transaction.sender,
            Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
        );
        assert.deepEqual(
            transaction.receiver,
            Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX, config.addressHrp),
        );
        assert.isDefined(transaction.data);
        assert.deepEqual(transaction.data, Buffer.from("createNewDelegationContract@010f0cf064dd59200000@0a"));
        assert.equal(transaction.gasLimit, 60126500n);
        assert.equal(transaction.value, value);
        assert.equal(transaction.chainID, config.chainID);
    });

    it("should create 'Transaction' for adding nodes", async function () {
        const sender = Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX);
        const publicKey = new ValidatorPublicKey(
            Buffer.from(
                "e7beaa95b3877f47348df4dd1cb578a4f7cabf7a20bfeefe5cdd263878ff132b765e04fef6f40c93512b666c47ed7719b8902f6c922c04247989b7137e837cc81a62e54712471c97a2ddab75aa9c2f58f813ed4c0fa722bde0ab718bff382208",
                "hex",
            ),
        );

        const mockMessage = {
            getSignature: () =>
                Buffer.from(
                    "81109fa1c8d3dc7b6c2d6e65206cc0bc1a83c9b2d1eb91a601d66ad32def430827d5eb52917bd2b0d04ce195738db216",
                    "hex",
                ),
        };

        const transaction = delegationFactory.createTransactionForAddingNodes(sender, {
            delegationContract: delegationContract,
            publicKeys: [publicKey],
            signedMessages: [mockMessage.getSignature()],
        });

        assert.deepEqual(
            transaction.sender,
            Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
        );
        assert.deepEqual(transaction.receiver, Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX));
        assert.isDefined(transaction.data);
        assert.deepEqual(
            transaction.data,
            Buffer.from(
                "addNodes@e7beaa95b3877f47348df4dd1cb578a4f7cabf7a20bfeefe5cdd263878ff132b765e04fef6f40c93512b666c47ed7719b8902f6c922c04247989b7137e837cc81a62e54712471c97a2ddab75aa9c2f58f813ed4c0fa722bde0ab718bff382208@81109fa1c8d3dc7b6c2d6e65206cc0bc1a83c9b2d1eb91a601d66ad32def430827d5eb52917bd2b0d04ce195738db216",
            ),
        );
        assert.equal(transaction.value, 0n);
    });

    it("should create 'Transaction' for removing nodes", async function () {
        const sender = Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX);

        const publicKey = new ValidatorPublicKey(
            Buffer.from(
                "be2e593ff10899a2ee8e1d5c8094e36c9f48e04b87e129991ff09475808743e07bb41bf6e7bc1463fa554c4b46594b98",
            ),
        );

        const transaction = delegationFactory.createTransactionForRemovingNodes(sender, {
            delegationContract: delegationContract,
            publicKeys: [publicKey],
        });

        assert.deepEqual(
            transaction.sender,
            Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
        );
        assert.deepEqual(transaction.receiver, Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX));
        assert.isDefined(transaction.data);
        assert.deepEqual(
            transaction.data,
            Buffer.from(
                "removeNodes@626532653539336666313038393961326565386531643563383039346533366339663438653034623837653132393939316666303934373538303837343365303762623431626636653762633134363366613535346334623436353934623938",
            ),
        );
        assert.equal(transaction.value, 0n);
    });

    it("should create 'Transaction' for staking nodes", async function () {
        const sender = Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX);
        const publicKey = new ValidatorPublicKey(
            Buffer.from(
                "be2e593ff10899a2ee8e1d5c8094e36c9f48e04b87e129991ff09475808743e07bb41bf6e7bc1463fa554c4b46594b98",
            ),
        );

        const transaction = delegationFactory.createTransactionForStakingNodes(sender, {
            delegationContract: delegationContract,
            publicKeys: [publicKey],
        });

        assert.deepEqual(
            transaction.sender,
            Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
        );
        assert.deepEqual(transaction.receiver, Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX));
        assert.isDefined(transaction.data);
        assert.deepEqual(
            transaction.data,
            Buffer.from(
                "stakeNodes@626532653539336666313038393961326565386531643563383039346533366339663438653034623837653132393939316666303934373538303837343365303762623431626636653762633134363366613535346334623436353934623938",
            ),
        );
        assert.equal(transaction.value, 0n);
    });

    it("should create 'Transaction' for unbonding nodes", async function () {
        const sender = Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX);
        const publicKey = new ValidatorPublicKey(
            Buffer.from(
                "be2e593ff10899a2ee8e1d5c8094e36c9f48e04b87e129991ff09475808743e07bb41bf6e7bc1463fa554c4b46594b98",
            ),
        );

        const transaction = delegationFactory.createTransactionForUnbondingNodes(sender, {
            delegationContract: delegationContract,
            publicKeys: [publicKey],
        });

        assert.deepEqual(
            transaction.sender,
            Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
        );
        assert.deepEqual(transaction.receiver, Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX));
        assert.isDefined(transaction.data);
        assert.deepEqual(
            transaction.data,
            Buffer.from(
                "unBondNodes@626532653539336666313038393961326565386531643563383039346533366339663438653034623837653132393939316666303934373538303837343365303762623431626636653762633134363366613535346334623436353934623938",
            ),
        );
        assert.equal(transaction.value, 0n);
        assert.equal(transaction.gasLimit, 12356000n);
    });

    it("should create 'Transaction' for unstaking nodes", async function () {
        const sender = Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX);
        const publicKey = new ValidatorPublicKey(
            Buffer.from(
                "be2e593ff10899a2ee8e1d5c8094e36c9f48e04b87e129991ff09475808743e07bb41bf6e7bc1463fa554c4b46594b98",
            ),
        );

        const transaction = delegationFactory.createTransactionForUnstakingNodes(sender, {
            delegationContract: delegationContract,
            publicKeys: [publicKey],
        });

        assert.deepEqual(
            transaction.sender,
            Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
        );
        assert.deepEqual(transaction.receiver, Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX));
        assert.isDefined(transaction.data);
        assert.deepEqual(
            transaction.data,
            Buffer.from(
                "unStakeNodes@626532653539336666313038393961326565386531643563383039346533366339663438653034623837653132393939316666303934373538303837343365303762623431626636653762633134363366613535346334623436353934623938",
            ),
        );
        assert.equal(transaction.value, 0n);
        assert.equal(transaction.gasLimit, 12357500n);
    });

    it("should create 'Transaction' for unjailing nodes", async function () {
        const sender = Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX);
        const publicKey = new ValidatorPublicKey(
            Buffer.from(
                "be2e593ff10899a2ee8e1d5c8094e36c9f48e04b87e129991ff09475808743e07bb41bf6e7bc1463fa554c4b46594b98",
            ),
        );

        const transaction = delegationFactory.createTransactionForUnjailingNodes(sender, {
            delegationContract: delegationContract,
            publicKeys: [publicKey],
            amount: 25000000000000000000n,
        });
        assert.deepEqual(
            transaction.sender,
            Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
        );
        assert.deepEqual(transaction.receiver, Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX));
        assert.isDefined(transaction.data);
        assert.deepEqual(
            transaction.data,
            Buffer.from(
                "unJailNodes@626532653539336666313038393961326565386531643563383039346533366339663438653034623837653132393939316666303934373538303837343365303762623431626636653762633134363366613535346334623436353934623938",
            ),
        );
        assert.equal(transaction.value, 25000000000000000000n);
    });

    it("should create 'Transaction' for changing service fee", async function () {
        const sender = Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX);
        const serviceFee = 10n;

        const transaction = delegationFactory.createTransactionForChangingServiceFee(sender, {
            delegationContract: delegationContract,
            serviceFee: serviceFee,
        });

        assert.deepEqual(
            transaction.sender,
            Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
        );
        assert.deepEqual(transaction.receiver, Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX));
        assert.isDefined(transaction.data);
        assert.deepEqual(transaction.data, Buffer.from("changeServiceFee@0a"));
        assert.equal(transaction.value, 0n);
    });

    it("should create 'Transaction' for changing delegation cap", async function () {
        const sender = Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX);
        const delegationCap = 5000000000000000000000n;

        const transaction = delegationFactory.createTransactionForModifyingDelegationCap(sender, {
            delegationContract: delegationContract,
            delegationCap: delegationCap,
        });

        assert.deepEqual(
            transaction.sender,
            Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
        );
        assert.deepEqual(transaction.receiver, Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX));
        assert.isDefined(transaction.data);
        assert.deepEqual(transaction.data, Buffer.from("modifyTotalDelegationCap@010f0cf064dd59200000"));
        assert.equal(transaction.value, 0n);
    });

    it("should create 'Transaction' for setting automatic activation", async function () {
        const sender = Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX);

        const transaction = delegationFactory.createTransactionForSettingAutomaticActivation(sender, {
            delegationContract: delegationContract,
        });

        assert.deepEqual(
            transaction.sender,
            Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
        );
        assert.deepEqual(transaction.receiver, Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX));
        assert.isDefined(transaction.data);
        assert.deepEqual(transaction.data, Buffer.from("setAutomaticActivation@74727565"));
        assert.equal(transaction.value, 0n);
    });

    it("should create 'Transaction' for unsetting automatic activation", async function () {
        const sender = Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX);

        const transaction = delegationFactory.createTransactionForUnsettingAutomaticActivation(sender, {
            delegationContract: delegationContract,
        });

        assert.deepEqual(
            transaction.sender,
            Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
        );
        assert.deepEqual(transaction.receiver, Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX));
        assert.isDefined(transaction.data);
        assert.deepEqual(transaction.data, Buffer.from("setAutomaticActivation@66616c7365"));
        assert.equal(transaction.value, 0n);
    });

    it("should create 'Transaction' for setting cap check on redelegate rewards", async function () {
        const sender = Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX);

        const transaction = delegationFactory.createTransactionForSettingCapCheckOnRedelegateRewards(sender, {
            delegationContract: delegationContract,
        });

        assert.deepEqual(
            transaction.sender,
            Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
        );
        assert.deepEqual(transaction.receiver, Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX));
        assert.isDefined(transaction.data);
        assert.deepEqual(transaction.data, Buffer.from("setCheckCapOnReDelegateRewards@74727565"));
        assert.equal(transaction.value, 0n);
    });

    it("should create 'Transaction' for unsetting cap check on redelegate rewards", async function () {
        const sender = Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX);

        const transaction = delegationFactory.createTransactionForUnsettingCapCheckOnRedelegateRewards(sender, {
            delegationContract: delegationContract,
        });

        assert.deepEqual(
            transaction.sender,
            Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
        );
        assert.deepEqual(transaction.receiver, Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX));
        assert.isDefined(transaction.data);
        assert.deepEqual(transaction.data, Buffer.from("setCheckCapOnReDelegateRewards@66616c7365"));
        assert.equal(transaction.value, 0n);
    });

    it("should create 'Transaction' for setting metadata", async function () {
        const sender = Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX);

        const transaction = delegationFactory.createTransactionForSettingMetadata(sender, {
            delegationContract: delegationContract,
            name: "name",
            website: "website",
            identifier: "identifier",
        });

        assert.deepEqual(
            transaction.sender,
            Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
        );
        assert.deepEqual(transaction.receiver, Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX));
        assert.isDefined(transaction.data);
        assert.deepEqual(transaction.data, Buffer.from("setMetaData@6e616d65@77656273697465@6964656e746966696572"));
        assert.equal(transaction.value, 0n);
    });

    it("should create 'Transaction' for delegating", async function () {
        const sender = Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX);

        const transaction = delegationFactory.createTransactionForDelegating(sender, {
            delegationContract: delegationContract,
            amount: 1000000000000000000n,
        });

        assert.deepEqual(
            transaction.sender,
            Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
        );
        assert.deepEqual(transaction.receiver, Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX));
        assert.isDefined(transaction.data);
        assert.deepEqual(transaction.data, Buffer.from("delegate"));
        assert.equal(transaction.value, 1000000000000000000n);
    });

    it("should create 'Transaction' for claiming rewards", async function () {
        const sender = Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX);

        const transaction = delegationFactory.createTransactionForClaimingRewards(sender, {
            delegationContract: delegationContract,
        });

        assert.deepEqual(
            transaction.sender,
            Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
        );
        assert.deepEqual(transaction.receiver, Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX));
        assert.isDefined(transaction.data);
        assert.deepEqual(transaction.data, Buffer.from("claimRewards"));
    });

    it("should create 'Transaction' for redelegating rewards", async function () {
        const sender = Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX);

        const transaction = delegationFactory.createTransactionForRedelegatingRewards(sender, {
            delegationContract: delegationContract,
        });

        assert.deepEqual(
            transaction.sender,
            Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
        );
        assert.deepEqual(transaction.receiver, Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX));
        assert.isDefined(transaction.data);
        assert.deepEqual(transaction.data, Buffer.from("reDelegateRewards"));
    });

    it("should create 'Transaction' for undelegating", async function () {
        const sender = Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX);

        const transaction = delegationFactory.createTransactionForUndelegating(sender, {
            delegationContract: delegationContract,
            amount: 1000000000000000000n,
        });

        assert.deepEqual(
            transaction.sender,
            Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
        );
        assert.deepEqual(transaction.receiver, Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX));
        assert.isDefined(transaction.data);
        assert.deepEqual(transaction.data, Buffer.from("unDelegate@0de0b6b3a7640000"));
        assert.equal(transaction.value, 0n);
    });

    it("should create 'Transaction' for withdrawing", async function () {
        const sender = Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2");
        const delegationContract = Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX);

        const transaction = delegationFactory.createTransactionForWithdrawing(sender, {
            delegationContract: delegationContract,
        });

        assert.deepEqual(
            transaction.sender,
            Address.newFromBech32("erd18s6a06ktr2v6fgxv4ffhauxvptssnaqlds45qgsrucemlwc8rawq553rt2"),
        );
        assert.deepEqual(transaction.receiver, Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX));
        assert.isDefined(transaction.data);
        assert.deepEqual(transaction.data, Buffer.from("withdraw"));
        assert.equal(transaction.value, 0n);
    });
});
