import { IAddress, ITransactionPayload } from "../interface";
import { BigNumber } from "bignumber.js";
import { numberToPaddedHex, byteArrayToHex, utf8ToHex } from "../utils.codec";
import { Address } from "../address";
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
    private dataParts!: string[];
    private addDataMovementGas!: boolean;
    private providedGasLimit!: BigNumber;

    constructor(config: Config) {
        this.config = config;
    }

    createTransactionForNewDelegationContract(options: {
        sender: IAddress,
        totalDelegationCap: BigNumber.Value,
        serviceFee: BigNumber.Value,
        amount: BigNumber.Value
    }): TransactionNext {
        this.dataParts = [
            "createNewDelegationContract",
            numberToPaddedHex(options.totalDelegationCap.toString()),
            numberToPaddedHex(options.serviceFee.toString())
        ];

        const data = this.buildTransactionPayload();
        this.addDataMovementGas = true;
        this.providedGasLimit = new BigNumber(this.config.gasLimitCreateDelegationContract).plus(this.config.additionalGasLimitForDelegationOperations);
        const gasLimit = this.computeGasLimit(data);


        return new TransactionNext({
            sender: options.sender.bech32(),
            receiver: Address.fromBech32(DELEGATION_MANAGER_SC_ADDRESS).bech32(),
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

        this.dataParts = ["addNodes"];
        for (let i = 0; i < numNodes; i++) {
            this.dataParts.push(...[options.publicKeys[i].hex(), byteArrayToHex(options.signedMessages[i])]);
        }
        const data = this.buildTransactionPayload();
        this.addDataMovementGas = true;
        this.providedGasLimit = new BigNumber(this.computeExecutionGasLimitForNodesManagement(numNodes));
        const gasLimit = this.computeGasLimit(data);

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
        this.dataParts = ["removeNodes"];

        for (const key of options.publicKeys) {
            this.dataParts.push(key.hex());
        }

        const data = this.buildTransactionPayload();
        const numNodes = options.publicKeys.length;
        this.addDataMovementGas = true;
        this.providedGasLimit = new BigNumber(this.computeExecutionGasLimitForNodesManagement(numNodes));
        const gasLimit = this.computeGasLimit(data);

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
        this.dataParts = ["stakeNodes"];

        for (const key of options.publicKeys) {
            this.dataParts = this.dataParts.concat(key.hex());
        }

        const data = this.buildTransactionPayload();
        const numNodes = options.publicKeys.length;
        const additionalGasForAllNodes = new BigNumber(numNodes).multipliedBy(this.config.additionalGasLimitPerValidatorNode);
        this.addDataMovementGas = true;
        this.providedGasLimit = additionalGasForAllNodes.plus(this.config.gasLimitStake).plus(
            this.config.gasLimitDelegationOperations
        );
        const gasLimit = this.computeGasLimit(data);

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
        this.dataParts = ["unBondNodes"];

        for (const key of options.publicKeys) {
            this.dataParts = this.dataParts.concat(key.hex());
        }

        const data = this.buildTransactionPayload();
        const numNodes = options.publicKeys.length;
        this.addDataMovementGas = true;
        this.providedGasLimit = new BigNumber(numNodes).multipliedBy(
            this.config.additionalGasLimitPerValidatorNode).plus(
                this.config.gasLimitUnbond
            ).plus(this.config.gasLimitDelegationOperations);
        const gasLimit = this.computeGasLimit(data);

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
        this.dataParts = ["unStakeNodes"];

        for (const key of options.publicKeys) {
            this.dataParts = this.dataParts.concat(key.hex());
        }

        const data = this.buildTransactionPayload();
        const numNodes = options.publicKeys.length;
        this.addDataMovementGas = true;
        this.providedGasLimit = new BigNumber(numNodes).multipliedBy(
            this.config.additionalGasLimitPerValidatorNode).plus(
                this.config.gasLimitUnstake
            ).plus(this.config.gasLimitDelegationOperations);
        const gasLimit = this.computeGasLimit(data);

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
        this.dataParts = ["unJailNodes"];

        for (const key of options.publicKeys) {
            this.dataParts.push(key.hex());
        }

        const numNodes = options.publicKeys.length;
        const data = this.buildTransactionPayload();
        this.addDataMovementGas = true;
        this.providedGasLimit = new BigNumber(this.computeExecutionGasLimitForNodesManagement(numNodes));
        const gasLimit = this.computeGasLimit(data);

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
        this.dataParts = [
            "changeServiceFee",
            numberToPaddedHex(options.serviceFee)
        ];

        const data = this.buildTransactionPayload();
        this.addDataMovementGas = true;
        this.providedGasLimit = new BigNumber(this.config.gasLimitDelegationOperations).plus(this.config.additionalGasLimitForDelegationOperations);
        const gasLimit = this.computeGasLimit(data);

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
        this.dataParts = [
            "modifyTotalDelegationCap",
            numberToPaddedHex(options.delegationCap)
        ];

        const data = this.buildTransactionPayload();
        this.addDataMovementGas = true;
        this.providedGasLimit = new BigNumber(this.config.gasLimitDelegationOperations).plus(this.config.additionalGasLimitForDelegationOperations);
        const gasLimit = this.computeGasLimit(data);

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
        this.dataParts = [
            "setAutomaticActivation",
            utf8ToHex("true")
        ];

        const data = this.buildTransactionPayload();
        this.addDataMovementGas = true;
        this.providedGasLimit = new BigNumber(this.config.gasLimitDelegationOperations).plus(this.config.additionalGasLimitForDelegationOperations);
        const gasLimit = this.computeGasLimit(data);

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
        this.dataParts = [
            "setAutomaticActivation",
            utf8ToHex("false")
        ];

        const data = this.buildTransactionPayload();
        this.addDataMovementGas = true;
        this.providedGasLimit = new BigNumber(this.config.gasLimitDelegationOperations).plus(this.config.additionalGasLimitForDelegationOperations);
        const gasLimit = this.computeGasLimit(data);

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
        this.dataParts = [
            "setCheckCapOnReDelegateRewards",
            utf8ToHex("true")
        ];

        const data = this.buildTransactionPayload();
        this.addDataMovementGas = true;
        this.providedGasLimit = new BigNumber(this.config.gasLimitDelegationOperations).plus(this.config.additionalGasLimitForDelegationOperations);
        const gasLimit = this.computeGasLimit(data);

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
        this.dataParts = [
            "setCheckCapOnReDelegateRewards",
            utf8ToHex("false")
        ];

        const data = this.buildTransactionPayload();
        this.addDataMovementGas = true;
        this.providedGasLimit = new BigNumber(this.config.gasLimitDelegationOperations).plus(this.config.additionalGasLimitForDelegationOperations);
        const gasLimit = this.computeGasLimit(data);

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
        this.dataParts = [
            "setMetaData",
            utf8ToHex(options.name),
            utf8ToHex(options.website),
            utf8ToHex(options.identifier)
        ];

        const data = this.buildTransactionPayload();
        this.addDataMovementGas = true;
        this.providedGasLimit = new BigNumber(this.config.gasLimitDelegationOperations).plus(this.config.additionalGasLimitForDelegationOperations);
        const gasLimit = this.computeGasLimit(data);

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

    private buildTransactionPayload(): TransactionPayload {
        const data = this.dataParts.join(ARGUMENTS_SEPARATOR);
        return new TransactionPayload(data);
    }
    
    private computeGasLimit(payload: ITransactionPayload): BigNumber.Value {
        if (!this.addDataMovementGas) {
            return this.providedGasLimit;
        }

        const dataMovementGas = new BigNumber(this.config.minGasLimit).plus(new BigNumber(this.config.gasLimitPerByte).multipliedBy(payload.length()));
        const gasLimit = dataMovementGas.plus(this.providedGasLimit);
        return gasLimit;
    }
}
