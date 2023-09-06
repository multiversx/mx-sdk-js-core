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

    private computeExecutionGasLimitForNodesManagement(numNodes: number): BigNumber.Value {
        const additionalGasForAllNodes = new BigNumber(this.config.additionalGasLimitPerValidatorNode).multipliedBy(new BigNumber(numNodes));
        return new BigNumber(this.config.gasLimitDelegationOperations).plus(additionalGasForAllNodes);
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

    createTransactionIntentForUnbondingNodes(
        sender: IAddress,
        delegationContract: IAddress,
        publicKeys: ValidatorPublicKey[]
    ): TransactionIntent {
        let dataParts = ["unBondNodes"];

        for (const key of publicKeys) {
            dataParts = dataParts.concat(key.hex());
        }

        const numNodes = publicKeys.length;
        const executionGasLimit = new BigNumber(numNodes).multipliedBy(
            new BigNumber(this.config.additionalGasLimitPerValidatorNode)).plus(
                new BigNumber(this.config.gasLimitUnbond)
            ).plus(this.config.gasLimitDelegationOperations);

        return new TransactionIntentBuilder(
            this.config,
            sender,
            delegationContract,
            dataParts,
            executionGasLimit
        ).build();
    }

    createTransactionIntentForUnstakingNodes(
        sender: IAddress,
        delegationContract: IAddress,
        publicKeys: ValidatorPublicKey[]
    ): TransactionIntent {
        let dataParts = ["unStakeNodes"];

        for (const key of publicKeys) {
            dataParts = dataParts.concat(key.hex());
        }

        const numNodes = publicKeys.length;
        const executionGasLimit = new BigNumber(numNodes).multipliedBy(
            new BigNumber(this.config.additionalGasLimitPerValidatorNode)).plus(
                new BigNumber(this.config.gasLimitUnstake)
            ).plus(this.config.gasLimitDelegationOperations);

        return new TransactionIntentBuilder(
            this.config,
            sender,
            delegationContract,
            dataParts,
            executionGasLimit
        ).build();
    }

    createTransactionIntentForUnjailingNodes(
        sender: IAddress,
        delegationContract: IAddress,
        publicKeys: ValidatorPublicKey[]
    ): TransactionIntent {
        let dataParts = ["unJailNodes"];

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

    createTransactionIntentForChangingServiceFee(
        sender: IAddress,
        delegationContract: IAddress,
        serviceFee: BigNumber.Value
    ): TransactionIntent {
        const dataParts = [
            "changeServiceFee",
            numberToPaddedHex(serviceFee)
        ];

        return new TransactionIntentBuilder(
            this.config,
            sender,
            delegationContract,
            dataParts,
            new BigNumber(this.config.gasLimitDelegationOperations).plus(new BigNumber(this.config.additionalGasLimitForDelegationOperations))
        ).build();
    }

    createTransactionIntentForModifyingDelegationCap(
        sender: IAddress,
        delegationContract: IAddress,
        delegationCap: BigNumber.Value
    ): TransactionIntent {
        const dataParts = [
            "modifyTotalDelegationCap",
            numberToPaddedHex(delegationCap)
        ];

        return new TransactionIntentBuilder(
            this.config,
            sender,
            delegationContract,
            dataParts,
            new BigNumber(this.config.gasLimitDelegationOperations).plus(new BigNumber(this.config.additionalGasLimitForDelegationOperations))
        ).build();
    }

    createTransactionIntentForSettingAutomaticActivation(
        sender: IAddress,
        delegationContract: IAddress
    ): TransactionIntent {
        const dataParts = [
            "setAutomaticActivation",
            utf8ToHex("true")
        ];

        return new TransactionIntentBuilder(
            this.config,
            sender,
            delegationContract,
            dataParts,
            new BigNumber(this.config.gasLimitDelegationOperations).plus(new BigNumber(this.config.additionalGasLimitForDelegationOperations))
        ).build();
    }

    createTransactionIntentForUnsettingAutomaticActivation(
        sender: IAddress,
        delegationContract: IAddress
    ): TransactionIntent {
        const dataParts = [
            "setAutomaticActivation",
            utf8ToHex("false")
        ];

        return new TransactionIntentBuilder(
            this.config,
            sender,
            delegationContract,
            dataParts,
            new BigNumber(this.config.gasLimitDelegationOperations).plus(new BigNumber(this.config.additionalGasLimitForDelegationOperations))
        ).build();
    }

    createTransactionIntentForSettingCapCheckOnRedelegateRewards(
        sender: IAddress,
        delegationContract: IAddress
    ): TransactionIntent {
        const dataParts = [
            "setCheckCapOnReDelegateRewards",
            utf8ToHex("true")
        ];

        return new TransactionIntentBuilder(
            this.config,
            sender,
            delegationContract,
            dataParts,
            new BigNumber(this.config.gasLimitDelegationOperations).plus(new BigNumber(this.config.additionalGasLimitForDelegationOperations))
        ).build();
    }

    createTransactionIntentForUnsettingCapCheckOnRedelegateRewards(
        sender: IAddress,
        delegationContract: IAddress
    ): TransactionIntent {
        const dataParts = [
            "setCheckCapOnReDelegateRewards",
            utf8ToHex("false")
        ];

        return new TransactionIntentBuilder(
            this.config,
            sender,
            delegationContract,
            dataParts,
            new BigNumber(this.config.gasLimitDelegationOperations).plus(new BigNumber(this.config.additionalGasLimitForDelegationOperations))
        ).build();
    }

    createTransactionIntentForSettingMetadata(
        sender: IAddress,
        delegationContract: IAddress,
        name: string,
        website: string,
        identifier: string
    ): TransactionIntent {
        const dataParts = [
            "setMetaData",
            utf8ToHex(name),
            utf8ToHex(website),
            utf8ToHex(identifier)
        ];

        return new TransactionIntentBuilder(
            this.config,
            sender,
            delegationContract,
            dataParts,
            new BigNumber(this.config.gasLimitDelegationOperations).plus(new BigNumber(this.config.additionalGasLimitForDelegationOperations))
        ).build();
    }
}
