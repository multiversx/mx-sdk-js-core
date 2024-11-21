import { ArgSerializer, BigUIntValue, BytesValue, StringValue } from "../abi";
import { Address } from "../address";
import { DELEGATION_MANAGER_SC_ADDRESS_HEX } from "../constants";
import { Err } from "../errors";
import { IAddress } from "../interface";
import { Transaction } from "../transaction";
import { TransactionBuilder } from "../transactionBuilder";
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
        this.delegationManagerAddress = Address.fromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX, this.config.addressHrp);
    }

    createTransactionForNewDelegationContract(
        sender: IAddress,
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

    createTransactionForAddingNodes(sender: IAddress, options: resources.AddNodesInput): Transaction {
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

    createTransactionForRemovingNodes(sender: IAddress, options: resources.ManageNodesInput): Transaction {
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

    createTransactionForStakingNodes(sender: IAddress, options: resources.ManageNodesInput): Transaction {
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

    createTransactionForUnbondingNodes(sender: IAddress, options: resources.ManageNodesInput): Transaction {
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

    createTransactionForUnstakingNodes(sender: IAddress, options: resources.ManageNodesInput): Transaction {
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

    createTransactionForUnjailingNodes(sender: IAddress, options: resources.UnjailingNodesInput): Transaction {
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

    createTransactionForChangingServiceFee(sender: IAddress, options: resources.ChangeServiceFee): Transaction {
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
        sender: IAddress,
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
        sender: IAddress,
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
        sender: IAddress,
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
        sender: IAddress,
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
        sender: IAddress,
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

    createTransactionForSettingMetadata(sender: IAddress, options: resources.SetContractMetadataInput): Transaction {
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

    createTransactionForWithdrawing(_sender: IAddress, _options: resources.ManageDelegationContractInput): Transaction {
        throw new Error("Method not implemented.");
    }

    createTransactionForUndelegating(_sender: IAddress, _options: resources.DelegateActionsInput): Transaction {
        throw new Error("Method not implemented.");
    }

    createTransactionForRedelegatingRewards(
        _sender: IAddress,
        _options: resources.ManageDelegationContractInput,
    ): Transaction {
        throw new Error("Method not implemented.");
    }

    createTransactionForClaimingRewards(
        _sender: IAddress,
        _options: resources.ManageDelegationContractInput,
    ): Transaction {
        throw new Error("Method not implemented.");
    }

    createTransactionForDelegating(_sender: IAddress, _options: resources.DelegateActionsInput): Transaction {
        throw new Error("Method not implemented.");
    }

    private computeExecutionGasLimitForNodesManagement(numNodes: number): bigint {
        const additionalGasForAllNodes = this.config.additionalGasLimitPerValidatorNode * BigInt(numNodes);

        return this.config.gasLimitDelegationOperations + additionalGasForAllNodes;
    }
}
