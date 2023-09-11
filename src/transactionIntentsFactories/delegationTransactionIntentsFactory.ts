import { IAddress } from "../interface";
import { BigNumber } from "bignumber.js";
import { numberToPaddedHex, byteArrayToHex, utf8ToHex } from "../utils.codec";
import { TransactionIntent } from "../transactionIntent";
import { TransactionIntentBuilder } from "./transactionIntentBuilder";
import { Address } from "../address";
import { DELEGATION_MANAGER_SC_ADDRESS } from "../constants";
import { Err } from "../errors";

interface Config {
    chainID: string;
    minGasLimit: BigNumber.Value;
    gasLimitPerByte: BigNumber.Value;
    gasLimitStake: BigNumber.Value;
    gasLimitUnstake: BigNumber.Value;
    gasLimitUnbond: BigNumber.Value;
    gasLimitCreateDelegationContract: BigNumber.Value;
    gasLimitDelegationOperations: BigNumber.Value;
    additionalGasLimitPerValidatorNode: BigNumber.Value;
    additionalGasLimitForDelegationOperations: BigNumber.Value;
}

interface IValidatorPublicKey {
    hex(): string;
}

export class DelegationTransactionIntentsFactory {
    private readonly config: Config;

    constructor(config: Config) {
        this.config = config;
    }

    createTransactionIntentForNewDelegationContract(options: {
        sender: IAddress,
        totalDelegationCap: BigNumber.Value,
        serviceFee: BigNumber.Value,
        value: BigNumber.Value
    }): TransactionIntent {
        const dataParts = [
            "createNewDelegationContract",
            numberToPaddedHex(options.totalDelegationCap.toString()),
            numberToPaddedHex(options.serviceFee.toString())
        ];

        const executionGasLimit = new BigNumber(this.config.gasLimitCreateDelegationContract).plus(this.config.additionalGasLimitForDelegationOperations);

        return new TransactionIntentBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(DELEGATION_MANAGER_SC_ADDRESS),
            dataParts: dataParts,
            executionGasLimit: executionGasLimit,
            value: options.value
        }).build();
    }

    createTransactionIntentForAddingNodes(options: {
        sender: IAddress,
        delegationContract: IAddress,
        publicKeys: IValidatorPublicKey[],
        signedMessages: Uint8Array[]
    }): TransactionIntent {
        if (options.publicKeys.length !== options.signedMessages.length) {
            throw new Err("The number of public keys should match the number of signed messages");
        }

        const numNodes = options.publicKeys.length;

        const dataParts = ["addNodes"];
        for (let i = 0; i < numNodes; i++) {
            dataParts.push(...[options.publicKeys[i].hex(), byteArrayToHex(options.signedMessages[i])]);
        }

        return new TransactionIntentBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            executionGasLimit: this.computeExecutionGasLimitForNodesManagement(numNodes)
        }).build();
    }

    createTransactionIntentForRemovingNodes(options: {
        sender: IAddress,
        delegationContract: IAddress,
        publicKeys: IValidatorPublicKey[]
    }): TransactionIntent {
        const dataParts = ["removeNodes"];

        for (const key of options.publicKeys) {
            dataParts.push(key.hex());
        }

        const numNodes = options.publicKeys.length;

        return new TransactionIntentBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            executionGasLimit: this.computeExecutionGasLimitForNodesManagement(numNodes)
        }).build();
    }

    createTransactionIntentForStakingNodes(options: {
        sender: IAddress,
        delegationContract: IAddress,
        publicKeys: IValidatorPublicKey[]
    }): TransactionIntent {
        let dataParts = ["stakeNodes"];

        for (const key of options.publicKeys) {
            dataParts = dataParts.concat(key.hex());
        }

        const numNodes = options.publicKeys.length;
        const additionalGasForAllNodes = new BigNumber(numNodes).multipliedBy(this.config.additionalGasLimitPerValidatorNode);
        const executionGasLimit = additionalGasForAllNodes.plus(this.config.gasLimitStake).plus(
            this.config.gasLimitDelegationOperations
        );

        return new TransactionIntentBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            executionGasLimit: executionGasLimit
        }).build();
    }

    createTransactionIntentForUnbondingNodes(options: {
        sender: IAddress,
        delegationContract: IAddress,
        publicKeys: IValidatorPublicKey[]
    }): TransactionIntent {
        let dataParts = ["unBondNodes"];

        for (const key of options.publicKeys) {
            dataParts = dataParts.concat(key.hex());
        }

        const numNodes = options.publicKeys.length;
        const executionGasLimit = new BigNumber(numNodes).multipliedBy(
            this.config.additionalGasLimitPerValidatorNode).plus(
                this.config.gasLimitUnbond
            ).plus(this.config.gasLimitDelegationOperations);

        return new TransactionIntentBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            executionGasLimit: executionGasLimit
        }).build();
    }

    createTransactionIntentForUnstakingNodes(options: {
        sender: IAddress,
        delegationContract: IAddress,
        publicKeys: IValidatorPublicKey[]
    }): TransactionIntent {
        let dataParts = ["unStakeNodes"];

        for (const key of options.publicKeys) {
            dataParts = dataParts.concat(key.hex());
        }

        const numNodes = options.publicKeys.length;
        const executionGasLimit = new BigNumber(numNodes).multipliedBy(
            this.config.additionalGasLimitPerValidatorNode).plus(
                this.config.gasLimitUnstake
            ).plus(this.config.gasLimitDelegationOperations);

        return new TransactionIntentBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            executionGasLimit: executionGasLimit
        }).build();
    }

    createTransactionIntentForUnjailingNodes(options: {
        sender: IAddress,
        delegationContract: IAddress,
        publicKeys: IValidatorPublicKey[]
    }): TransactionIntent {
        const dataParts = ["unJailNodes"];

        for (const key of options.publicKeys) {
            dataParts.push(key.hex());
        }

        const numNodes = options.publicKeys.length;

        return new TransactionIntentBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            executionGasLimit: this.computeExecutionGasLimitForNodesManagement(numNodes)
        }).build();
    }

    createTransactionIntentForChangingServiceFee(options: {
        sender: IAddress,
        delegationContract: IAddress,
        serviceFee: BigNumber.Value
    }): TransactionIntent {
        const dataParts = [
            "changeServiceFee",
            numberToPaddedHex(options.serviceFee)
        ];

        return new TransactionIntentBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            executionGasLimit: new BigNumber(this.config.gasLimitDelegationOperations).plus(this.config.additionalGasLimitForDelegationOperations)
        }).build();
    }

    createTransactionIntentForModifyingDelegationCap(options: {
        sender: IAddress,
        delegationContract: IAddress,
        delegationCap: BigNumber.Value
    }): TransactionIntent {
        const dataParts = [
            "modifyTotalDelegationCap",
            numberToPaddedHex(options.delegationCap)
        ];

        return new TransactionIntentBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            executionGasLimit: new BigNumber(this.config.gasLimitDelegationOperations).plus(this.config.additionalGasLimitForDelegationOperations)
        }).build();
    }

    createTransactionIntentForSettingAutomaticActivation(options: {
        sender: IAddress,
        delegationContract: IAddress
    }): TransactionIntent {
        const dataParts = [
            "setAutomaticActivation",
            utf8ToHex("true")
        ];

        return new TransactionIntentBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            executionGasLimit: new BigNumber(this.config.gasLimitDelegationOperations).plus(this.config.additionalGasLimitForDelegationOperations)
        }).build();
    }

    createTransactionIntentForUnsettingAutomaticActivation(options: {
        sender: IAddress,
        delegationContract: IAddress
    }): TransactionIntent {
        const dataParts = [
            "setAutomaticActivation",
            utf8ToHex("false")
        ];

        return new TransactionIntentBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            executionGasLimit: new BigNumber(this.config.gasLimitDelegationOperations).plus(this.config.additionalGasLimitForDelegationOperations)
        }).build();
    }

    createTransactionIntentForSettingCapCheckOnRedelegateRewards(options: {
        sender: IAddress,
        delegationContract: IAddress
    }): TransactionIntent {
        const dataParts = [
            "setCheckCapOnReDelegateRewards",
            utf8ToHex("true")
        ];

        return new TransactionIntentBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            executionGasLimit: new BigNumber(this.config.gasLimitDelegationOperations).plus(this.config.additionalGasLimitForDelegationOperations)
        }).build();
    }

    createTransactionIntentForUnsettingCapCheckOnRedelegateRewards(options: {
        sender: IAddress,
        delegationContract: IAddress
    }): TransactionIntent {
        const dataParts = [
            "setCheckCapOnReDelegateRewards",
            utf8ToHex("false")
        ];

        return new TransactionIntentBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            executionGasLimit: new BigNumber(this.config.gasLimitDelegationOperations).plus(this.config.additionalGasLimitForDelegationOperations)
        }).build();
    }

    createTransactionIntentForSettingMetadata(options: {
        sender: IAddress,
        delegationContract: IAddress,
        name: string,
        website: string,
        identifier: string
    }): TransactionIntent {
        const dataParts = [
            "setMetaData",
            utf8ToHex(options.name),
            utf8ToHex(options.website),
            utf8ToHex(options.identifier)
        ];

        return new TransactionIntentBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            executionGasLimit: new BigNumber(this.config.gasLimitDelegationOperations).plus(this.config.additionalGasLimitForDelegationOperations)
        }).build();
    }

    private computeExecutionGasLimitForNodesManagement(numNodes: number): BigNumber.Value {
        const additionalGasForAllNodes = new BigNumber(this.config.additionalGasLimitPerValidatorNode).multipliedBy(numNodes);
        return new BigNumber(this.config.gasLimitDelegationOperations).plus(additionalGasForAllNodes);
    }
}
