import { IAddress } from "../interface";
import { BigNumber } from "bignumber.js";
import { numberToPaddedHex, byteArrayToHex } from "../utils.codec";
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

interface ValidatorPublicKey {
    hex(): string;
}

export class DelegationTransactionIntentsFactory {
    private config: Config;

    constructor(config: Config) {
        this.config = config;
    }

    createTransactionIntentForNewDelegationContract(
        sender: IAddress,
        totalDelegationCap: BigNumber.Value,
        serviceFee: BigNumber.Value,
        value: BigNumber.Value
    ): TransactionIntent {
        const dataParts = [
            "createNewDelegationContract",
            numberToPaddedHex(totalDelegationCap.toString()),
            numberToPaddedHex(serviceFee.toString())
        ];

        const executionGasLimit = new BigNumber(this.config.gasLimitCreateDelegationContract).plus(new BigNumber(this.config.additionalGasLimitForDelegationOperations));

        return new TransactionIntentBuilder(
            this.config,
            sender,
            Address.fromBech32(DELEGATION_MANAGER_SC_ADDRESS),
            dataParts,
            executionGasLimit,
            value
        ).build();
    }

    createTransactionIntentForAddingNodes(
        sender: IAddress,
        delegationContract: IAddress,
        publicKeys: ValidatorPublicKey[],
        signedMessages: Uint8Array[]
    ): TransactionIntent {
        if (publicKeys.length !== signedMessages.length) {
            throw new Err("The number of public keys should match the number of signed messages");
        }

        const numNodes = publicKeys.length;

        let dataParts = ["addNodes"];
        for (let i = 0; i < numNodes; i++) {
            dataParts = dataParts.concat(publicKeys[i].hex());
            dataParts = dataParts.concat(byteArrayToHex(signedMessages[i]));
        }

        return new TransactionIntentBuilder(
            this.config,
            sender,
            delegationContract,
            dataParts,
            this.computeExecutionGasLimitForNodesManagement(numNodes)
        ).build();
    }

    createTransactionIntentForRemovingNodes(
        sender: IAddress,
        delegationContract: IAddress,
        publicKeys: ValidatorPublicKey[]
    ): TransactionIntent {
        let dataParts = ["removeNodes"];

        for (const key of publicKeys) {
            dataParts = dataParts.concat(key.hex());
        }

        const numNodes = publicKeys.length;

        return new TransactionIntentBuilder(
            this.config,
            sender,
            delegationContract,
            dataParts,
            this.computeExecutionGasLimitForNodesManagement(numNodes)
        ).build();
    }

    createTransactionIntentForStakingNodes(
        sender: IAddress,
        delegationContract: IAddress,
        publicKeys: ValidatorPublicKey[]
    ): TransactionIntent {
        let dataParts = ["stakeNodes"];

        for (const key of publicKeys) {
            dataParts = dataParts.concat(key.hex());
        }

        const numNodes = publicKeys.length;
        const executionGasLimit = new BigNumber(numNodes).multipliedBy(
            new BigNumber(this.config.additionalGasLimitPerValidatorNode)).plus(
                new BigNumber(this.config.gasLimitStake)
            ).plus(this.config.gasLimitDelegationOperations);

        return new TransactionIntentBuilder(
            this.config,
            sender,
            delegationContract,
            dataParts,
            executionGasLimit
        ).build();
    }

    private computeExecutionGasLimitForNodesManagement(numNodes: number): BigNumber.Value {
        const additionalGasForAllNodes = new BigNumber(this.config.additionalGasLimitPerValidatorNode).multipliedBy(new BigNumber(numNodes));
        return new BigNumber(this.config.gasLimitDelegationOperations).plus(additionalGasForAllNodes);
    }
}
