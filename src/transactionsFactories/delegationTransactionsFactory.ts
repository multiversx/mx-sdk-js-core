import { IAddress, ITransactionPayload } from "../interface";
import { BigNumber } from "bignumber.js";
import { numberToPaddedHex, byteArrayToHex, utf8ToHex } from "../utils.codec";
import { ARGUMENTS_SEPARATOR, DELEGATION_MANAGER_SC_ADDRESS } from "../constants";
import { Err } from "../errors";
import { TransactionNext } from "../transaction";
import { TransactionPayload } from "../transactionPayload";

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
        const dataParts: string[] = [
            "createNewDelegationContract",
            numberToPaddedHex(options.totalDelegationCap.toString()),
            numberToPaddedHex(options.serviceFee.toString())
        ];

        const data = this.buildTransactionPayload(dataParts);
        const extraGasLimit: BigNumber= new BigNumber(this.config.gasLimitCreateDelegationContract).plus(this.config.additionalGasLimitForDelegationOperations);
        const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: DELEGATION_MANAGER_SC_ADDRESS,
            data: data.valueOf(),
            gasLimit: gasLimit,
            value: options.amount,
            chainID: this.config.chainID
        });
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

        const dataParts: string[] = ["addNodes"];
        for (let i = 0; i < numNodes; i++) {
           dataParts.push(...[options.publicKeys[i].hex(), byteArrayToHex(options.signedMessages[i])]);
        }
        const data = this.buildTransactionPayload(dataParts);
        const extraGasLimit: BigNumber= new BigNumber(this.computeExecutionGasLimitForNodesManagement(numNodes));
        const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: options.delegationContract.bech32(),
            data: data.valueOf(),
            gasLimit: gasLimit,
            chainID: this.config.chainID
        });
    }

    createTransactionForRemovingNodes(options: {
        sender: IAddress,
        delegationContract: IAddress,
        publicKeys: IValidatorPublicKey[]
    }): TransactionNext {
        const dataParts: string[] = ["removeNodes"];
        for (const key of options.publicKeys) {
            dataParts.push(key.hex());
        }

        const data = this.buildTransactionPayload(dataParts);
        const numNodes = options.publicKeys.length;
        const extraGasLimit: BigNumber= new BigNumber(this.computeExecutionGasLimitForNodesManagement(numNodes));
        const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: options.delegationContract.bech32(),
            data: data.valueOf(),
            gasLimit: gasLimit,
            chainID: this.config.chainID
        });
    }

    createTransactionForStakingNodes(options: {
        sender: IAddress,
        delegationContract: IAddress,
        publicKeys: IValidatorPublicKey[]
    }): TransactionNext {
        let dataParts: string[] = ["stakeNodes"];

        for (const key of options.publicKeys) {
            dataParts = dataParts.concat(key.hex());
        }

        const data = this.buildTransactionPayload(dataParts);
        const numNodes = options.publicKeys.length;
        const additionalGasForAllNodes = new BigNumber(numNodes).multipliedBy(this.config.additionalGasLimitPerValidatorNode);
        const extraGasLimit: BigNumber= additionalGasForAllNodes.plus(this.config.gasLimitStake).plus(
            this.config.gasLimitDelegationOperations
        );
        const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: options.delegationContract.bech32(),
            data: data.valueOf(),
            gasLimit: gasLimit,
            chainID: this.config.chainID
        });
    }

    createTransactionForUnbondingNodes(options: {
        sender: IAddress,
        delegationContract: IAddress,
        publicKeys: IValidatorPublicKey[]
    }): TransactionNext {
        let dataParts: string[] = ["unBondNodes"];

        for (const key of options.publicKeys) {
            dataParts = dataParts.concat(key.hex());
        }

        const data = this.buildTransactionPayload(dataParts);
        const numNodes = options.publicKeys.length;
        const extraGasLimit: BigNumber= new BigNumber(numNodes).multipliedBy(
            this.config.additionalGasLimitPerValidatorNode).plus(
                this.config.gasLimitUnbond
            ).plus(this.config.gasLimitDelegationOperations);
            const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: options.delegationContract.bech32(),
            data: data.valueOf(),
            gasLimit: gasLimit,
            chainID: this.config.chainID
        });
    }

    createTransactionForUnstakingNodes(options: {
        sender: IAddress,
        delegationContract: IAddress,
        publicKeys: IValidatorPublicKey[]
    }): TransactionNext {
        let dataParts: string[] = ["unStakeNodes"];

        for (const key of options.publicKeys) {
            dataParts = dataParts.concat(key.hex());
        }

        const data = this.buildTransactionPayload(dataParts);
        const numNodes = options.publicKeys.length;
        const extraGasLimit: BigNumber= new BigNumber(numNodes).multipliedBy(
            this.config.additionalGasLimitPerValidatorNode).plus(
                this.config.gasLimitUnstake
            ).plus(this.config.gasLimitDelegationOperations);
            const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: options.delegationContract.bech32(),
            data: data.valueOf(),
            gasLimit: gasLimit,
            chainID: this.config.chainID
        });
    }

    createTransactionForUnjailingNodes(options: {
        sender: IAddress,
        delegationContract: IAddress,
        publicKeys: IValidatorPublicKey[]
    }): TransactionNext {
        const dataParts: string[] = ["unJailNodes"];

        for (const key of options.publicKeys) {
            dataParts.push(key.hex());
        }

        const numNodes = options.publicKeys.length;
        const data = this.buildTransactionPayload(dataParts);
        const extraGasLimit: BigNumber= new BigNumber(this.computeExecutionGasLimitForNodesManagement(numNodes));
        const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: options.delegationContract.bech32(),
            data: data.valueOf(),
            gasLimit: gasLimit,
            chainID: this.config.chainID
        });
    }

    createTransactionForChangingServiceFee(options: {
        sender: IAddress,
        delegationContract: IAddress,
        serviceFee: BigNumber.Value
    }): TransactionNext {
        const dataParts: string[] = [
            "changeServiceFee",
            numberToPaddedHex(options.serviceFee)
        ];

        const data = this.buildTransactionPayload(dataParts);
        const extraGasLimit: BigNumber= new BigNumber(this.config.gasLimitDelegationOperations).plus(this.config.additionalGasLimitForDelegationOperations);
        const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: options.delegationContract.bech32(),
            data: data.valueOf(),
            gasLimit: gasLimit,
            chainID: this.config.chainID
        });
    }

    createTransactionForModifyingDelegationCap(options: {
        sender: IAddress,
        delegationContract: IAddress,
        delegationCap: BigNumber.Value
    }): TransactionNext {
        const dataParts: string[] = [
            "modifyTotalDelegationCap",
            numberToPaddedHex(options.delegationCap)
        ];

        const data = this.buildTransactionPayload(dataParts);
        const extraGasLimit: BigNumber= new BigNumber(this.config.gasLimitDelegationOperations).plus(this.config.additionalGasLimitForDelegationOperations);
        const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: options.delegationContract.bech32(),
            data: data.valueOf(),
            gasLimit: gasLimit,
            chainID: this.config.chainID
        });
    }

    createTransactionForSettingAutomaticActivation(options: {
        sender: IAddress,
        delegationContract: IAddress
    }): TransactionNext {
        const dataParts: string[] = [
            "setAutomaticActivation",
            utf8ToHex("true")
        ];

        const data = this.buildTransactionPayload(dataParts);
        const extraGasLimit: BigNumber= new BigNumber(this.config.gasLimitDelegationOperations).plus(this.config.additionalGasLimitForDelegationOperations);
        const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: options.delegationContract.bech32(),
            data: data.valueOf(),
            gasLimit: gasLimit,
            chainID: this.config.chainID
        });
    }

    createTransactionForUnsettingAutomaticActivation(options: {
        sender: IAddress,
        delegationContract: IAddress
    }): TransactionNext {
        const dataParts: string[] = [
            "setAutomaticActivation",
            utf8ToHex("false")
        ];

        const data = this.buildTransactionPayload(dataParts);
        const extraGasLimit: BigNumber= new BigNumber(this.config.gasLimitDelegationOperations).plus(this.config.additionalGasLimitForDelegationOperations);
        const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: options.delegationContract.bech32(),
            data: data.valueOf(),
            gasLimit: gasLimit,
            chainID: this.config.chainID
        });
    }

    createTransactionForSettingCapCheckOnRedelegateRewards(options: {
        sender: IAddress,
        delegationContract: IAddress
    }): TransactionNext {
        const dataParts: string[] = [
            "setCheckCapOnReDelegateRewards",
            utf8ToHex("true")
        ];

        const data = this.buildTransactionPayload(dataParts);
        const extraGasLimit: BigNumber= new BigNumber(this.config.gasLimitDelegationOperations).plus(this.config.additionalGasLimitForDelegationOperations);
        const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: options.delegationContract.bech32(),
            data: data.valueOf(),
            gasLimit: gasLimit,
            chainID: this.config.chainID
        });
    }

    createTransactionForUnsettingCapCheckOnRedelegateRewards(options: {
        sender: IAddress,
        delegationContract: IAddress
    }): TransactionNext {
        const dataParts: string[] = [
            "setCheckCapOnReDelegateRewards",
            utf8ToHex("false")
        ];

        const data = this.buildTransactionPayload(dataParts);
        const extraGasLimit: BigNumber= new BigNumber(this.config.gasLimitDelegationOperations).plus(this.config.additionalGasLimitForDelegationOperations);
        const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: options.delegationContract.bech32(),
            data: data.valueOf(),
            gasLimit: gasLimit,
            chainID: this.config.chainID
        });
    }

    createTransactionForSettingMetadata(options: {
        sender: IAddress,
        delegationContract: IAddress,
        name: string,
        website: string,
        identifier: string
    }): TransactionNext {
        const dataParts: string[] = [
            "setMetaData",
            utf8ToHex(options.name),
            utf8ToHex(options.website),
            utf8ToHex(options.identifier)
        ];

        const data = this.buildTransactionPayload(dataParts);
        const extraGasLimit: BigNumber = new BigNumber(this.config.gasLimitDelegationOperations).plus(this.config.additionalGasLimitForDelegationOperations);
        const gasLimit = this.computeGasLimit(extraGasLimit, data);

        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: options.delegationContract.bech32(),
            data: data.valueOf(),
            gasLimit: gasLimit,
            chainID: this.config.chainID
        });
    }

    private computeExecutionGasLimitForNodesManagement(numNodes: number): BigNumber.Value {
        const additionalGasForAllNodes = new BigNumber(this.config.additionalGasLimitPerValidatorNode).multipliedBy(numNodes);
        return new BigNumber(this.config.gasLimitDelegationOperations).plus(additionalGasForAllNodes);
    }

    private buildTransactionPayload(dataParts: string[]): TransactionPayload {
        const data = dataParts.join(ARGUMENTS_SEPARATOR);
        return new TransactionPayload(data);
    }
    
    private computeGasLimit(extraGasLimit: BigNumber, payload: ITransactionPayload): BigNumber.Value {
        const dataMovementGas = new BigNumber(this.config.minGasLimit).plus(new BigNumber(this.config.gasLimitPerByte).multipliedBy(payload.length()));
        const gasLimit = dataMovementGas.plus(extraGasLimit);
        return gasLimit;
    }
}
