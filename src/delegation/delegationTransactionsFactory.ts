import { ArgSerializer, BigUIntValue, BytesValue, StringValue } from "../abi";
import { Address } from "../core/address";
import { DELEGATION_MANAGER_SC_ADDRESS_HEX } from "../core/constants";
import { Err } from "../core/errors";
import { Transaction } from "../core/transaction";
import { TransactionBuilder } from "../core/transactionBuilder";
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
export class DelegationTransactionsFactory {
    private readonly config: IConfig;
    private readonly argSerializer: ArgSerializer;
    private readonly delegationManagerAddress: Address;

    constructor(options: { config: IConfig }) {
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

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: this.delegationManagerAddress,
            dataParts: dataParts,
            gasLimit: executionGasLimit,
            addDataMovementGas: true,
            amount: options.amount,
        }).build();
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

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: this.computeExecutionGasLimitForNodesManagement(numNodes),
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForRemovingNodes(sender: Address, options: resources.ManageNodesInput): Transaction {
        const dataParts = ["removeNodes"];

        for (const key of options.publicKeys) {
            dataParts.push(key.hex());
        }

        const numNodes = options.publicKeys.length;
        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: this.computeExecutionGasLimitForNodesManagement(numNodes),
            addDataMovementGas: true,
        }).build();
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

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: executionGasLimit,
            addDataMovementGas: true,
        }).build();
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

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: executionGasLimit,
            addDataMovementGas: true,
        }).build();
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

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: executionGasLimit,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForUnjailingNodes(sender: Address, options: resources.UnjailingNodesInput): Transaction {
        const dataParts = ["unJailNodes"];

        for (const key of options.publicKeys) {
            dataParts.push(key.hex());
        }

        const numNodes = options.publicKeys.length;
        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: this.computeExecutionGasLimitForNodesManagement(numNodes),
            addDataMovementGas: true,
            amount: options.amount,
        }).build();
    }

    createTransactionForChangingServiceFee(sender: Address, options: resources.ChangeServiceFee): Transaction {
        const dataParts = [
            "changeServiceFee",
            this.argSerializer.valuesToStrings([new BigUIntValue(options.serviceFee)])[0],
        ];
        const gasLimit =
            this.config.gasLimitDelegationOperations + this.config.additionalGasLimitForDelegationOperations;

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
        }).build();
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

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForSettingAutomaticActivation(
        sender: Address,
        options: resources.ManageDelegationContractInput,
    ): Transaction {
        const dataParts = ["setAutomaticActivation", this.argSerializer.valuesToStrings([new StringValue("true")])[0]];
        const gasLimit =
            this.config.gasLimitDelegationOperations + this.config.additionalGasLimitForDelegationOperations;

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForUnsettingAutomaticActivation(
        sender: Address,
        options: resources.ManageDelegationContractInput,
    ): Transaction {
        const dataParts = ["setAutomaticActivation", this.argSerializer.valuesToStrings([new StringValue("false")])[0]];
        const gasLimit =
            this.config.gasLimitDelegationOperations + this.config.additionalGasLimitForDelegationOperations;

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
        }).build();
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

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
        }).build();
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

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
        }).build();
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

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForDelegating(sender: Address, options: resources.DelegateActionsInput): Transaction {
        const dataParts = ["delegate"];
        const gasLimit =
            this.config.gasLimitDelegationOperations + this.config.additionalGasLimitForDelegationOperations;

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            amount: options.amount,
            addDataMovementGas: false,
        }).build();
    }

    createTransactionForClaimingRewards(
        sender: Address,
        options: resources.ManageDelegationContractInput,
    ): Transaction {
        const dataParts = ["claimRewards"];
        const gasLimit =
            this.config.gasLimitDelegationOperations + this.config.additionalGasLimitForDelegationOperations;

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: false,
        }).build();
    }

    createTransactionForRedelegatingRewards(
        sender: Address,
        options: resources.ManageDelegationContractInput,
    ): Transaction {
        const dataParts = ["reDelegateRewards"];
        const gasLimit =
            this.config.gasLimitDelegationOperations + this.config.additionalGasLimitForDelegationOperations;

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: false,
        }).build();
    }

    createTransactionForUndelegating(sender: Address, options: resources.DelegateActionsInput): Transaction {
        const dataParts = ["unDelegate", this.argSerializer.valuesToStrings([new BigUIntValue(options.amount)])[0]];
        const gasLimit =
            this.config.gasLimitDelegationOperations + this.config.additionalGasLimitForDelegationOperations;

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: false,
        }).build();
    }

    createTransactionForWithdrawing(sender: Address, options: resources.ManageDelegationContractInput): Transaction {
        const dataParts = ["withdraw"];
        const gasLimit =
            this.config.gasLimitDelegationOperations + this.config.additionalGasLimitForDelegationOperations;

        return new TransactionBuilder({
            config: this.config,
            sender: sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: false,
        }).build();
    }

    private computeExecutionGasLimitForNodesManagement(numNodes: number): bigint {
        const additionalGasForAllNodes = this.config.additionalGasLimitPerValidatorNode * BigInt(numNodes);

        return this.config.gasLimitDelegationOperations + additionalGasForAllNodes;
    }
}
