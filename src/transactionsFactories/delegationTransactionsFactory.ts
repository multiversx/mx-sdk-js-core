import { IAddress } from "../interface";
import { numberToPaddedHex, byteArrayToHex, utf8ToHex } from "../utils.codec";
import { TransactionNextBuilder } from "./transactionNextBuilder";
import { Address } from "../address";
import { DELEGATION_MANAGER_SC_ADDRESS } from "../constants";
import { Err } from "../errors";
import { TransactionNext } from "../transaction";

interface Config {
    chainID: string;
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

interface IValidatorPublicKey {
    hex(): string;
}

/**
 * Use this class to create delegation related transactions like creating a new delegation contract or adding nodes.
 */
export class DelegationTransactionsFactory {
    private readonly config: Config;

    constructor(config: Config) {
        this.config = config;
    }

    createTransactionForNewDelegationContract(options: {
        sender: IAddress;
        totalDelegationCap: bigint;
        serviceFee: bigint;
        amount: bigint;
    }): TransactionNext {
        const dataParts = [
            "createNewDelegationContract",
            numberToPaddedHex(options.totalDelegationCap.toString()),
            numberToPaddedHex(options.serviceFee.toString()),
        ];

        const executionGasLimit =
            this.config.gasLimitCreateDelegationContract + this.config.additionalGasLimitForDelegationOperations;

        return new TransactionNextBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(DELEGATION_MANAGER_SC_ADDRESS),
            dataParts: dataParts,
            gasLimit: executionGasLimit,
            addDataMovementGas: true,
            amount: options.amount,
        }).build();
    }

    createTransactionForAddingNodes(options: {
        sender: IAddress;
        delegationContract: IAddress;
        publicKeys: IValidatorPublicKey[];
        signedMessages: Uint8Array[];
    }): TransactionNext {
        if (options.publicKeys.length !== options.signedMessages.length) {
            throw new Err("The number of public keys should match the number of signed messages");
        }

        const numNodes = options.publicKeys.length;
        const dataParts = ["addNodes"];

        for (let i = 0; i < numNodes; i++) {
            dataParts.push(...[options.publicKeys[i].hex(), byteArrayToHex(options.signedMessages[i])]);
        }

        return new TransactionNextBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: this.computeExecutionGasLimitForNodesManagement(numNodes),
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForRemovingNodes(options: {
        sender: IAddress;
        delegationContract: IAddress;
        publicKeys: IValidatorPublicKey[];
    }): TransactionNext {
        const dataParts = ["removeNodes"];

        for (const key of options.publicKeys) {
            dataParts.push(key.hex());
        }

        const numNodes = options.publicKeys.length;
        return new TransactionNextBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: this.computeExecutionGasLimitForNodesManagement(numNodes),
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForStakingNodes(options: {
        sender: IAddress;
        delegationContract: IAddress;
        publicKeys: IValidatorPublicKey[];
    }): TransactionNext {
        let dataParts = ["stakeNodes"];

        for (const key of options.publicKeys) {
            dataParts = dataParts.concat(key.hex());
        }

        const numNodes = options.publicKeys.length;
        const additionalGasForAllNodes = BigInt(numNodes) * this.config.additionalGasLimitPerValidatorNode;

        const executionGasLimit =
            additionalGasForAllNodes + this.config.gasLimitStake + this.config.gasLimitDelegationOperations;

        return new TransactionNextBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: executionGasLimit,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForUnbondingNodes(options: {
        sender: IAddress;
        delegationContract: IAddress;
        publicKeys: IValidatorPublicKey[];
    }): TransactionNext {
        let dataParts = ["unBondNodes"];

        for (const key of options.publicKeys) {
            dataParts = dataParts.concat(key.hex());
        }

        const numNodes = options.publicKeys.length;
        const executionGasLimit =
            BigInt(numNodes) * this.config.additionalGasLimitPerValidatorNode +
            this.config.gasLimitUnbond +
            this.config.gasLimitDelegationOperations;

        return new TransactionNextBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: executionGasLimit,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForUnstakingNodes(options: {
        sender: IAddress;
        delegationContract: IAddress;
        publicKeys: IValidatorPublicKey[];
    }): TransactionNext {
        let dataParts = ["unStakeNodes"];

        for (const key of options.publicKeys) {
            dataParts = dataParts.concat(key.hex());
        }

        const numNodes = options.publicKeys.length;
        const executionGasLimit =
            BigInt(numNodes) * this.config.additionalGasLimitPerValidatorNode +
            this.config.gasLimitUnstake +
            this.config.gasLimitDelegationOperations;

        return new TransactionNextBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: executionGasLimit,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForUnjailingNodes(options: {
        sender: IAddress;
        delegationContract: IAddress;
        publicKeys: IValidatorPublicKey[];
    }): TransactionNext {
        const dataParts = ["unJailNodes"];

        for (const key of options.publicKeys) {
            dataParts.push(key.hex());
        }

        const numNodes = options.publicKeys.length;
        return new TransactionNextBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: this.computeExecutionGasLimitForNodesManagement(numNodes),
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForChangingServiceFee(options: {
        sender: IAddress;
        delegationContract: IAddress;
        serviceFee: bigint;
    }): TransactionNext {
        const dataParts = ["changeServiceFee", numberToPaddedHex(options.serviceFee)];
        const gasLimit =
            this.config.gasLimitDelegationOperations + this.config.additionalGasLimitForDelegationOperations;

        return new TransactionNextBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForModifyingDelegationCap(options: {
        sender: IAddress;
        delegationContract: IAddress;
        delegationCap: bigint;
    }): TransactionNext {
        const dataParts = ["modifyTotalDelegationCap", numberToPaddedHex(options.delegationCap)];
        const gasLimit =
            this.config.gasLimitDelegationOperations + this.config.additionalGasLimitForDelegationOperations;

        return new TransactionNextBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForSettingAutomaticActivation(options: {
        sender: IAddress;
        delegationContract: IAddress;
    }): TransactionNext {
        const dataParts = ["setAutomaticActivation", utf8ToHex("true")];
        const gasLimit =
            this.config.gasLimitDelegationOperations + this.config.additionalGasLimitForDelegationOperations;

        return new TransactionNextBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForUnsettingAutomaticActivation(options: {
        sender: IAddress;
        delegationContract: IAddress;
    }): TransactionNext {
        const dataParts = ["setAutomaticActivation", utf8ToHex("false")];
        const gasLimit =
            this.config.gasLimitDelegationOperations + this.config.additionalGasLimitForDelegationOperations;

        return new TransactionNextBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForSettingCapCheckOnRedelegateRewards(options: {
        sender: IAddress;
        delegationContract: IAddress;
    }): TransactionNext {
        const dataParts = ["setCheckCapOnReDelegateRewards", utf8ToHex("true")];
        const gasLimit =
            this.config.gasLimitDelegationOperations + this.config.additionalGasLimitForDelegationOperations;

        return new TransactionNextBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForUnsettingCapCheckOnRedelegateRewards(options: {
        sender: IAddress;
        delegationContract: IAddress;
    }): TransactionNext {
        const dataParts = ["setCheckCapOnReDelegateRewards", utf8ToHex("false")];
        const gasLimit =
            this.config.gasLimitDelegationOperations + this.config.additionalGasLimitForDelegationOperations;

        return new TransactionNextBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
        }).build();
    }

    createTransactionForSettingMetadata(options: {
        sender: IAddress;
        delegationContract: IAddress;
        name: string;
        website: string;
        identifier: string;
    }): TransactionNext {
        const dataParts = [
            "setMetaData",
            utf8ToHex(options.name),
            utf8ToHex(options.website),
            utf8ToHex(options.identifier),
        ];

        const gasLimit =
            this.config.gasLimitDelegationOperations + this.config.additionalGasLimitForDelegationOperations;

        return new TransactionNextBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: gasLimit,
            addDataMovementGas: true,
        }).build();
    }

    private computeExecutionGasLimitForNodesManagement(numNodes: number): bigint {
        const additionalGasForAllNodes = this.config.additionalGasLimitPerValidatorNode * BigInt(numNodes);

        return this.config.gasLimitDelegationOperations + additionalGasForAllNodes;
    }
}
