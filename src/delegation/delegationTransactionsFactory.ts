import { ArgSerializer, BigUIntValue, BytesValue, StringValue } from "../abi";
import { IGasLimitEstimator } from "../core";
import { Address } from "../core/address";
import { BaseFactory } from "../core/baseFactory";
import { DELEGATION_MANAGER_SC_ADDRESS_HEX } from "../core/constants";
import { Err } from "../core/errors";
import { Transaction } from "../core/transaction";
import * as resources from "./resources";

interface IConfig {
    chainID: string;
    addressHrp: string;
    minGasLimit: bigint;
    gasLimitPerByte: bigint;
    gasLimitStake: bigint;
    gasLimitUnstake: bigint;
    gasLimitUnbond: bigint;
    gasLimitCreateDelegationContract: bigint;
    gasLimitDelegationOperations: bigint;
    additionalGasLimitPerValidatorNode: bigint;
    additionalGasLimitForDelegationOperations: bigint;
}

/**
 * Use this class to create delegation related transactions like creating a new delegation contract or adding nodes.
 */
export class DelegationTransactionsFactory extends BaseFactory {
    private readonly config: IConfig;
    private readonly argSerializer: ArgSerializer;
    private readonly delegationManagerAddress: Address;

    constructor(options: { config: IConfig; gasLimitEstimator?: IGasLimitEstimator }) {
        super({ config: options.config, gasLimitEstimator: options.gasLimitEstimator });
        this.config = options.config;
        this.argSerializer = new ArgSerializer();
        this.delegationManagerAddress = Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX, this.config.addressHrp);
    }

    createTransactionForNewDelegationContract(
        sender: Address,
        options: resources.NewDelegationContractInput,
    ): Transaction {
        const dataParts = [
            "createNewDelegationContract",
            ...this.argSerializer.valuesToStrings([
                new BigUIntValue(options.totalDelegationCap),
                new BigUIntValue(options.serviceFee),
            ]),
        ];

        const executionGasLimit =
            this.config.gasLimitCreateDelegationContract + this.config.additionalGasLimitForDelegationOperations;

        const transaction = new Transaction({
            sender,
            receiver: this.delegationManagerAddress,
            chainID: this.config.chainID,
            gasLimit: 0n,
            value: options.amount,
        });

        this.setTransactionPayload(transaction, dataParts);
        this.setGasLimit(transaction, undefined, executionGasLimit);

        return transaction;
    }

    createTransactionForAddingNodes(sender: Address, options: resources.AddNodesInput): Transaction {
        if (options.publicKeys.length !== options.signedMessages.length) {
            throw new Err("The number of public keys should match the number of signed messages");
        }

        const signedMessagesAsTypedValues = options.signedMessages.map(
            (message) => new BytesValue(Buffer.from(message)),
        );
        const messagesAsStrings = this.argSerializer.valuesToStrings(signedMessagesAsTypedValues);

        const numNodes = options.publicKeys.length;
        const dataParts = ["addNodes"];

        for (let i = 0; i < numNodes; i++) {
            dataParts.push(...[options.publicKeys[i].hex(), messagesAsStrings[i]]);
        }

        const transaction = new Transaction({
            sender,
            receiver: options.delegationContract,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        const executionGasLimit = this.computeExecutionGasLimitForNodesManagement(numNodes);
        this.setGasLimit(transaction, undefined, executionGasLimit);

        return transaction;
    }

    createTransactionForRemovingNodes(sender: Address, options: resources.ManageNodesInput): Transaction {
        const dataParts = ["removeNodes"];

        for (const key of options.publicKeys) {
            dataParts.push(key.hex());
        }

        const transaction = new Transaction({
            sender,
            receiver: options.delegationContract,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        const numNodes = options.publicKeys.length;
        const executionGasLimit = this.computeExecutionGasLimitForNodesManagement(numNodes);
        this.setGasLimit(transaction, undefined, executionGasLimit);

        return transaction;
    }

    createTransactionForStakingNodes(sender: Address, options: resources.ManageNodesInput): Transaction {
        let dataParts = ["stakeNodes"];

        for (const key of options.publicKeys) {
            dataParts = dataParts.concat(key.hex());
        }

        const numNodes = options.publicKeys.length;
        const additionalGasForAllNodes = BigInt(numNodes) * this.config.additionalGasLimitPerValidatorNode;

        const executionGasLimit =
            additionalGasForAllNodes + this.config.gasLimitStake + this.config.gasLimitDelegationOperations;

        const transaction = new Transaction({
            sender,
            receiver: options.delegationContract,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        this.setGasLimit(transaction, undefined, executionGasLimit);

        return transaction;
    }

    createTransactionForUnbondingNodes(sender: Address, options: resources.ManageNodesInput): Transaction {
        let dataParts = ["unBondNodes"];

        for (const key of options.publicKeys) {
            dataParts = dataParts.concat(key.hex());
        }

        const numNodes = options.publicKeys.length;
        const executionGasLimit =
            BigInt(numNodes) * this.config.additionalGasLimitPerValidatorNode +
            this.config.gasLimitUnbond +
            this.config.gasLimitDelegationOperations;

        const transaction = new Transaction({
            sender,
            receiver: options.delegationContract,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        this.setGasLimit(transaction, undefined, executionGasLimit);

        return transaction;
    }

    createTransactionForUnstakingNodes(sender: Address, options: resources.ManageNodesInput): Transaction {
        let dataParts = ["unStakeNodes"];

        for (const key of options.publicKeys) {
            dataParts = dataParts.concat(key.hex());
        }

        const numNodes = options.publicKeys.length;
        const executionGasLimit =
            BigInt(numNodes) * this.config.additionalGasLimitPerValidatorNode +
            this.config.gasLimitUnstake +
            this.config.gasLimitDelegationOperations;

        const transaction = new Transaction({
            sender,
            receiver: options.delegationContract,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        this.setGasLimit(transaction, undefined, executionGasLimit);

        return transaction;
    }

    createTransactionForUnjailingNodes(sender: Address, options: resources.UnjailingNodesInput): Transaction {
        const dataParts = ["unJailNodes"];

        for (const key of options.publicKeys) {
            dataParts.push(key.hex());
        }

        const transaction = new Transaction({
            sender,
            receiver: options.delegationContract,
            chainID: this.config.chainID,
            gasLimit: 0n,
            value: options.amount,
        });

        this.setTransactionPayload(transaction, dataParts);
        const numNodes = options.publicKeys.length;
        const executionGasLimit = this.computeExecutionGasLimitForNodesManagement(numNodes);
        this.setGasLimit(transaction, undefined, executionGasLimit);

        return transaction;
    }

    createTransactionForChangingServiceFee(sender: Address, options: resources.ChangeServiceFee): Transaction {
        const dataParts = [
            "changeServiceFee",
            this.argSerializer.valuesToStrings([new BigUIntValue(options.serviceFee)])[0],
        ];
        const gasLimit =
            this.config.gasLimitDelegationOperations + this.config.additionalGasLimitForDelegationOperations;

        const transaction = new Transaction({
            sender,
            receiver: options.delegationContract,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        this.setGasLimit(transaction, undefined, gasLimit);

        return transaction;
    }

    createTransactionForModifyingDelegationCap(
        sender: Address,
        options: resources.ModifyDelegationCapInput,
    ): Transaction {
        const dataParts = [
            "modifyTotalDelegationCap",
            this.argSerializer.valuesToStrings([new BigUIntValue(options.delegationCap)])[0],
        ];
        const gasLimit =
            this.config.gasLimitDelegationOperations + this.config.additionalGasLimitForDelegationOperations;

        const transaction = new Transaction({
            sender,
            receiver: options.delegationContract,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        this.setGasLimit(transaction, undefined, gasLimit);

        return transaction;
    }

    createTransactionForSettingAutomaticActivation(
        sender: Address,
        options: resources.ManageDelegationContractInput,
    ): Transaction {
        const dataParts = ["setAutomaticActivation", this.argSerializer.valuesToStrings([new StringValue("true")])[0]];
        const gasLimit =
            this.config.gasLimitDelegationOperations + this.config.additionalGasLimitForDelegationOperations;

        const transaction = new Transaction({
            sender,
            receiver: options.delegationContract,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        this.setGasLimit(transaction, undefined, gasLimit);

        return transaction;
    }

    createTransactionForUnsettingAutomaticActivation(
        sender: Address,
        options: resources.ManageDelegationContractInput,
    ): Transaction {
        const dataParts = ["setAutomaticActivation", this.argSerializer.valuesToStrings([new StringValue("false")])[0]];
        const gasLimit =
            this.config.gasLimitDelegationOperations + this.config.additionalGasLimitForDelegationOperations;

        const transaction = new Transaction({
            sender,
            receiver: options.delegationContract,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        this.setGasLimit(transaction, undefined, gasLimit);

        return transaction;
    }

    createTransactionForSettingCapCheckOnRedelegateRewards(
        sender: Address,
        options: resources.ManageDelegationContractInput,
    ): Transaction {
        const dataParts = [
            "setCheckCapOnReDelegateRewards",
            this.argSerializer.valuesToStrings([new StringValue("true")])[0],
        ];
        const gasLimit =
            this.config.gasLimitDelegationOperations + this.config.additionalGasLimitForDelegationOperations;

        const transaction = new Transaction({
            sender,
            receiver: options.delegationContract,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        this.setGasLimit(transaction, undefined, gasLimit);

        return transaction;
    }

    createTransactionForUnsettingCapCheckOnRedelegateRewards(
        sender: Address,
        options: resources.ManageDelegationContractInput,
    ): Transaction {
        const dataParts = [
            "setCheckCapOnReDelegateRewards",
            this.argSerializer.valuesToStrings([new StringValue("false")])[0],
        ];
        const gasLimit =
            this.config.gasLimitDelegationOperations + this.config.additionalGasLimitForDelegationOperations;

        const transaction = new Transaction({
            sender,
            receiver: options.delegationContract,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        this.setGasLimit(transaction, undefined, gasLimit);

        return transaction;
    }

    createTransactionForSettingMetadata(sender: Address, options: resources.SetContractMetadataInput): Transaction {
        const dataParts = [
            "setMetaData",
            ...this.argSerializer.valuesToStrings([
                new StringValue(options.name),
                new StringValue(options.website),
                new StringValue(options.identifier),
            ]),
        ];

        const gasLimit =
            this.config.gasLimitDelegationOperations + this.config.additionalGasLimitForDelegationOperations;

        const transaction = new Transaction({
            sender,
            receiver: options.delegationContract,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        this.setGasLimit(transaction, undefined, gasLimit);

        return transaction;
    }

    createTransactionForDelegating(sender: Address, options: resources.DelegateActionsInput): Transaction {
        const dataParts = ["delegate"];
        const gasLimit =
            this.config.gasLimitDelegationOperations + this.config.additionalGasLimitForDelegationOperations;

        const transaction = new Transaction({
            sender,
            receiver: options.delegationContract,
            chainID: this.config.chainID,
            gasLimit: 0n,
            value: options.amount,
        });

        this.setTransactionPayload(transaction, dataParts);
        this.setGasLimit(transaction, undefined, gasLimit);

        return transaction;
    }

    createTransactionForClaimingRewards(
        sender: Address,
        options: resources.ManageDelegationContractInput,
    ): Transaction {
        const dataParts = ["claimRewards"];
        const gasLimit =
            this.config.gasLimitDelegationOperations + this.config.additionalGasLimitForDelegationOperations;

        const transaction = new Transaction({
            sender,
            receiver: options.delegationContract,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        this.setGasLimit(transaction, undefined, gasLimit);

        return transaction;
    }

    createTransactionForRedelegatingRewards(
        sender: Address,
        options: resources.ManageDelegationContractInput,
    ): Transaction {
        const dataParts = ["reDelegateRewards"];
        const gasLimit =
            this.config.gasLimitDelegationOperations + this.config.additionalGasLimitForDelegationOperations;

        const transaction = new Transaction({
            sender,
            receiver: options.delegationContract,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        this.setGasLimit(transaction, undefined, gasLimit);

        return transaction;
    }

    createTransactionForUndelegating(sender: Address, options: resources.DelegateActionsInput): Transaction {
        const dataParts = ["unDelegate", this.argSerializer.valuesToStrings([new BigUIntValue(options.amount)])[0]];
        const gasLimit =
            this.config.gasLimitDelegationOperations + this.config.additionalGasLimitForDelegationOperations;

        const transaction = new Transaction({
            sender,
            receiver: options.delegationContract,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        this.setGasLimit(transaction, undefined, gasLimit);

        return transaction;
    }

    createTransactionForWithdrawing(sender: Address, options: resources.ManageDelegationContractInput): Transaction {
        const dataParts = ["withdraw"];
        const gasLimit =
            this.config.gasLimitDelegationOperations + this.config.additionalGasLimitForDelegationOperations;

        const transaction = new Transaction({
            sender,
            receiver: options.delegationContract,
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        this.setGasLimit(transaction, undefined, gasLimit);

        return transaction;
    }

    private computeExecutionGasLimitForNodesManagement(numNodes: number): bigint {
        const additionalGasForAllNodes = this.config.additionalGasLimitPerValidatorNode * BigInt(numNodes);
        return this.config.gasLimitDelegationOperations + additionalGasForAllNodes;
    }
}
