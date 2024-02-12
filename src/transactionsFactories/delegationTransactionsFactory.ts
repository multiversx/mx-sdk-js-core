import { IAddress } from "../interface";
import { BigNumber } from "bignumber.js";
import { numberToPaddedHex, byteArrayToHex, utf8ToHex } from "../utils.codec";
import { TransactionNextBuilder } from "./transactionNextBuilder";
import { Address } from "../address";
import { DELEGATION_MANAGER_SC_ADDRESS } from "../constants";
import { Err } from "../errors";
import { TransactionNext } from "../transaction";
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
export class DelegationTransactionsFactory {
    private readonly config: Config;
    constructor(config: Config) {
        this.config = config;
    }
    createTransactionForNewDelegationContract(options: {
        sender: IAddress,
        totalDelegationCap: BigNumber.Value,
        serviceFee: BigNumber.Value,
        amount: BigNumber.Value
    }): TransactionNext {
        const dataParts = [
            "createNewDelegationContract",
            numberToPaddedHex(options.totalDelegationCap.toString()),
            numberToPaddedHex(options.serviceFee.toString())
        ];
        const executionGasLimit = new BigNumber(this.config.gasLimitCreateDelegationContract).plus(this.config.additionalGasLimitForDelegationOperations);
        return new TransactionNextBuilder({
            config: this.config,
            sender: options.sender,
            receiver: Address.fromBech32(DELEGATION_MANAGER_SC_ADDRESS),
            dataParts: dataParts,
            gasLimit: executionGasLimit,
            addDataMovementGas: true,
            amount: options.amount
        }).build();
    }
    createTransactionForAddingNodes(options: {
        sender: IAddress,
        delegationContract: IAddress,
        publicKeys: IValidatorPublicKey[],
        signedMessages: Uint8Array[]
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
            addDataMovementGas: true
        }).build();
    }
    createTransactionForRemovingNodes(options: {
        sender: IAddress,
        delegationContract: IAddress,
        publicKeys: IValidatorPublicKey[]
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
            addDataMovementGas: true
        }).build();
    }
    createTransactionForStakingNodes(options: {
        sender: IAddress,
        delegationContract: IAddress,
        publicKeys: IValidatorPublicKey[]
    }): TransactionNext {
        let dataParts = ["stakeNodes"];
        for (const key of options.publicKeys) {
            dataParts = dataParts.concat(key.hex());
        }
        const numNodes = options.publicKeys.length;
        const additionalGasForAllNodes = new BigNumber(numNodes).multipliedBy(this.config.additionalGasLimitPerValidatorNode);
        const executionGasLimit = additionalGasForAllNodes.plus(this.config.gasLimitStake).plus(
            this.config.gasLimitDelegationOperations
        );
        return new TransactionNextBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: executionGasLimit,
            addDataMovementGas: true
        }).build();
    }
    createTransactionForUnbondingNodes(options: {
        sender: IAddress,
        delegationContract: IAddress,
        publicKeys: IValidatorPublicKey[]
    }): TransactionNext {
        let dataParts = ["unBondNodes"];
        for (const key of options.publicKeys) {
            dataParts = dataParts.concat(key.hex());
        }
        const numNodes = options.publicKeys.length;
        const executionGasLimit = new BigNumber(numNodes).multipliedBy(
            this.config.additionalGasLimitPerValidatorNode).plus(
                this.config.gasLimitUnbond
            ).plus(this.config.gasLimitDelegationOperations);
        return new TransactionNextBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: executionGasLimit,
            addDataMovementGas: true
        }).build();
    }
    createTransactionForUnstakingNodes(options: {
        sender: IAddress,
        delegationContract: IAddress,
        publicKeys: IValidatorPublicKey[]
    }): TransactionNext {
        let dataParts = ["unStakeNodes"];
        for (const key of options.publicKeys) {
            dataParts = dataParts.concat(key.hex());
        }
        const numNodes = options.publicKeys.length;
        const executionGasLimit = new BigNumber(numNodes).multipliedBy(
            this.config.additionalGasLimitPerValidatorNode).plus(
                this.config.gasLimitUnstake
            ).plus(this.config.gasLimitDelegationOperations);
        return new TransactionNextBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: executionGasLimit,
            addDataMovementGas: true
        }).build();
    }
    createTransactionForUnjailingNodes(options: {
        sender: IAddress,
        delegationContract: IAddress,
        publicKeys: IValidatorPublicKey[]
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
            addDataMovementGas: true
        }).build();
    }
    createTransactionForChangingServiceFee(options: {
        sender: IAddress,
        delegationContract: IAddress,
        serviceFee: BigNumber.Value
    }): TransactionNext {
        const dataParts = [
            "changeServiceFee",
            numberToPaddedHex(options.serviceFee)
        ];
        return new TransactionNextBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: new BigNumber(this.config.gasLimitDelegationOperations).plus(this.config.additionalGasLimitForDelegationOperations),
            addDataMovementGas: true
        }).build();
    }
    createTransactionForModifyingDelegationCap(options: {
        sender: IAddress,
        delegationContract: IAddress,
        delegationCap: BigNumber.Value
    }): TransactionNext {
        const dataParts = [
            "modifyTotalDelegationCap",
            numberToPaddedHex(options.delegationCap)
        ];
        return new TransactionNextBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: new BigNumber(this.config.gasLimitDelegationOperations).plus(this.config.additionalGasLimitForDelegationOperations),
            addDataMovementGas: true
        }).build();
    }
    createTransactionForSettingAutomaticActivation(options: {
        sender: IAddress,
        delegationContract: IAddress
    }): TransactionNext {
        const dataParts = [
            "setAutomaticActivation",
            utf8ToHex("true")
        ];
        return new TransactionNextBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: new BigNumber(this.config.gasLimitDelegationOperations).plus(this.config.additionalGasLimitForDelegationOperations),
            addDataMovementGas: true
        }).build();
    }
    createTransactionForUnsettingAutomaticActivation(options: {
        sender: IAddress,
        delegationContract: IAddress
    }): TransactionNext {
        const dataParts = [
            "setAutomaticActivation",
            utf8ToHex("false")
        ];
        return new TransactionNextBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: new BigNumber(this.config.gasLimitDelegationOperations).plus(this.config.additionalGasLimitForDelegationOperations),
            addDataMovementGas: true
        }).build();
    }
    createTransactionForSettingCapCheckOnRedelegateRewards(options: {
        sender: IAddress,
        delegationContract: IAddress
    }): TransactionNext {
        const dataParts = [
            "setCheckCapOnReDelegateRewards",
            utf8ToHex("true")
        ];
        return new TransactionNextBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: new BigNumber(this.config.gasLimitDelegationOperations).plus(this.config.additionalGasLimitForDelegationOperations),
            addDataMovementGas: true
        }).build();
    }
    createTransactionForUnsettingCapCheckOnRedelegateRewards(options: {
        sender: IAddress,
        delegationContract: IAddress
    }): TransactionNext {
        const dataParts = [
            "setCheckCapOnReDelegateRewards",
            utf8ToHex("false")
        ];
        return new TransactionNextBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: new BigNumber(this.config.gasLimitDelegationOperations).plus(this.config.additionalGasLimitForDelegationOperations),
            addDataMovementGas: true
        }).build();
    }
    createTransactionForSettingMetadata(options: {
        sender: IAddress,
        delegationContract: IAddress,
        name: string,
        website: string,
        identifier: string
    }): TransactionNext {
        const dataParts = [
            "setMetaData",
            utf8ToHex(options.name),
            utf8ToHex(options.website),
            utf8ToHex(options.identifier)
        ];
        return new TransactionNextBuilder({
            config: this.config,
            sender: options.sender,
            receiver: options.delegationContract,
            dataParts: dataParts,
            gasLimit: new BigNumber(this.config.gasLimitDelegationOperations).plus(this.config.additionalGasLimitForDelegationOperations),
            addDataMovementGas: true
        }).build();
    }
    private computeExecutionGasLimitForNodesManagement(numNodes: number): BigNumber.Value {
        const additionalGasForAllNodes = new BigNumber(this.config.additionalGasLimitPerValidatorNode).multipliedBy(numNodes);
        return new BigNumber(this.config.gasLimitDelegationOperations).plus(additionalGasForAllNodes);
    }
}