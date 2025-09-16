import { AddressValue, ArgSerializer, BigUIntValue, BytesValue, U32Value } from "../abi";
import { IGasLimitEstimator, TransactionsFactoryConfig } from "../core";
import { Address } from "../core/address";
import { BaseFactory } from "../core/baseFactory";
import { DELEGATION_MANAGER_SC_ADDRESS_HEX, STAKING_SMART_CONTRACT_ADDRESS_HEX } from "../core/constants";
import { Transaction } from "../core/transaction";
import * as resources from "./resources";
import { ValidatorsSigners } from "./validatorsSigner";

/**
 * Use this class to create validators related transactions like creating transaction for staking or adding nodes.
 */
export class ValidatorsTransactionsFactory extends BaseFactory {
    private readonly config: TransactionsFactoryConfig;
    private readonly argSerializer: ArgSerializer;

    constructor(options: { config: TransactionsFactoryConfig; gasLimitEstimator?: IGasLimitEstimator }) {
        super({ config: options.config, gasLimitEstimator: options.gasLimitEstimator });
        this.config = options.config;
        this.argSerializer = new ArgSerializer();
    }

    async createTransactionForStaking(sender: Address, options: resources.StakingInput): Promise<Transaction> {
        let validators: ValidatorsSigners;
        if (typeof options.validatorsFile === "string") {
            validators = await ValidatorsSigners.newFromPem(options.validatorsFile);
        } else {
            validators = options.validatorsFile;
        }

        const dataParts = this.prepareDataPartsForStaking({
            nodeOperator: sender,
            validatorsFile: validators,
            rewardsAddress: options.rewardsAddress,
        });

        const transaction = new Transaction({
            sender,
            receiver: Address.newFromHex(STAKING_SMART_CONTRACT_ADDRESS_HEX, this.config.addressHrp),
            chainID: this.config.chainID,
            gasLimit: 0n,
            value: options.amount,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(
            transaction,
            undefined,
            this.config.gasLimitForStaking * BigInt(validators.getNumOfNodes()),
        );

        return transaction;
    }

    private prepareDataPartsForStaking(options: {
        nodeOperator: Address;
        validatorsFile: ValidatorsSigners;
        rewardsAddress: Address | undefined;
    }) {
        const dataParts = ["stake"];
        const numOfNodes = options.validatorsFile.getNumOfNodes();

        const callArguments = [];
        callArguments.push(new U32Value(numOfNodes));

        for (const signer of options.validatorsFile.getSigners()) {
            const signedMessages = signer.sign(options.nodeOperator.getPublicKey());
            callArguments.push(new BytesValue(Buffer.from(signer.getPubkey())));
            callArguments.push(new BytesValue(Buffer.from(signedMessages)));
        }
        if (options.rewardsAddress) {
            callArguments.push(new AddressValue(options.rewardsAddress));
        }
        const args = this.argSerializer.valuesToStrings(callArguments);
        return dataParts.concat(args);
    }

    async createTransactionForToppingUp(sender: Address, options: resources.ToppingUpInput): Promise<Transaction> {
        const data = ["stake"];

        const transaction = new Transaction({
            sender,
            receiver: Address.newFromHex(STAKING_SMART_CONTRACT_ADDRESS_HEX, this.config.addressHrp),
            chainID: this.config.chainID,
            gasLimit: 0n,
            value: options.amount,
        });

        this.setTransactionPayload(transaction, data);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitForToppingUp);

        return transaction;
    }

    async createTransactionForUnstaking(sender: Address, options: resources.UnstakingInput): Promise<Transaction> {
        const dataParts = ["unStake"];

        for (const key of options.publicKeys) {
            dataParts.push(key.hex());
        }

        const transaction = new Transaction({
            sender,
            receiver: Address.newFromHex(STAKING_SMART_CONTRACT_ADDRESS_HEX, this.config.addressHrp),
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(
            transaction,
            undefined,
            this.config.gasLimitForUnstaking * BigInt(options.publicKeys.length),
        );

        return transaction;
    }

    async createTransactionForUnjailing(sender: Address, options: resources.UnjailingInput): Promise<Transaction> {
        let dataParts = ["unJail"];

        for (const key of options.publicKeys) {
            dataParts.push(key.hex());
        }

        const transaction = new Transaction({
            sender,
            receiver: Address.newFromHex(STAKING_SMART_CONTRACT_ADDRESS_HEX, this.config.addressHrp),
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(
            transaction,
            undefined,
            this.config.gasLimitForUnjailing * BigInt(options.publicKeys.length),
        );

        return transaction;
    }

    async createTransactionForUnbounding(sender: Address, options: resources.UnboundInput): Promise<Transaction> {
        let dataParts = ["unBond"];

        for (const key of options.publicKeys) {
            dataParts.push(key.hex());
        }

        const transaction = new Transaction({
            sender,
            receiver: Address.newFromHex(STAKING_SMART_CONTRACT_ADDRESS_HEX, this.config.addressHrp),
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(
            transaction,
            undefined,
            this.config.gasLimitForUnbonding * BigInt(options.publicKeys.length),
        );

        return transaction;
    }

    async createTransactionForChangingRewardsAddress(
        sender: Address,
        options: resources.ChangeRewardsAddressInput,
    ): Promise<Transaction> {
        let dataParts = ["changeRewardAddress", options.rewardsAddress.toHex()];

        const transaction = new Transaction({
            sender,
            receiver: Address.newFromHex(STAKING_SMART_CONTRACT_ADDRESS_HEX, this.config.addressHrp),
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitForChangingRewardsAddress);

        return transaction;
    }

    async createTransactionForClaiming(sender: Address): Promise<Transaction> {
        const dataParts = ["claim"];

        const transaction = new Transaction({
            sender,
            receiver: Address.newFromHex(STAKING_SMART_CONTRACT_ADDRESS_HEX, this.config.addressHrp),
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitForClaiming);

        return transaction;
    }

    async createTransactionForUnstakingNodes(sender: Address, options: resources.UnstakingInput): Promise<Transaction> {
        let dataParts = ["unStakeNodes"];
        for (const key of options.publicKeys) {
            dataParts.push(key.hex());
        }

        const transaction = new Transaction({
            sender,
            receiver: Address.newFromHex(STAKING_SMART_CONTRACT_ADDRESS_HEX, this.config.addressHrp),
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(
            transaction,
            undefined,
            this.config.gasLimitForUnstakingNodes * BigInt(options.publicKeys.length),
        );

        return transaction;
    }

    async createTransactionForUnstakingTokens(
        sender: Address,
        options: resources.UnstakingTokensInput,
    ): Promise<Transaction> {
        const dataParts = ["unStakeTokens", this.argSerializer.valuesToStrings([new BigUIntValue(options.amount)])[0]];

        const transaction = new Transaction({
            sender,
            receiver: Address.newFromHex(STAKING_SMART_CONTRACT_ADDRESS_HEX, this.config.addressHrp),
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitForRestakingUnstakedTokens);

        return transaction;
    }

    async createTransactionForUnboundingNodes(sender: Address, options: resources.UnboundInput): Promise<Transaction> {
        let dataParts = ["unBondNodes"];
        for (const key of options.publicKeys) {
            dataParts.push(key.hex());
        }
        const transaction = new Transaction({
            sender,
            receiver: Address.newFromHex(STAKING_SMART_CONTRACT_ADDRESS_HEX, this.config.addressHrp),
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(
            transaction,
            undefined,
            this.config.gasLimitForUnbondingNodes * BigInt(options.publicKeys.length),
        );

        return transaction;
    }

    async createTransactionForUnboundingTokens(
        sender: Address,
        options: resources.UnboundTokensInput,
    ): Promise<Transaction> {
        const dataParts = ["unBondTokens", this.argSerializer.valuesToStrings([new BigUIntValue(options.amount)])[0]];

        const transaction = new Transaction({
            sender,
            receiver: Address.newFromHex(STAKING_SMART_CONTRACT_ADDRESS_HEX, this.config.addressHrp),
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitForUnbondingTokens);

        return transaction;
    }

    async createTransactionForCleaningRegisteredData(sender: Address): Promise<Transaction> {
        const dataParts = ["cleanRegisteredData"];

        const transaction = new Transaction({
            sender,
            receiver: Address.newFromHex(STAKING_SMART_CONTRACT_ADDRESS_HEX, this.config.addressHrp),
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitForCleaningRegisteredData);

        return transaction;
    }

    async createTransactionForRestakingUnstakedNodes(
        sender: Address,
        options: resources.RestakingInput,
    ): Promise<Transaction> {
        let dataParts = ["reStakeUnStakedNodes"];
        for (const key of options.publicKeys) {
            dataParts.push(key.hex());
        }
        const transaction = new Transaction({
            sender,
            receiver: Address.newFromHex(STAKING_SMART_CONTRACT_ADDRESS_HEX, this.config.addressHrp),
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(
            transaction,
            undefined,
            this.config.gasLimitForUnstakingNodes * BigInt(options.publicKeys.length),
        );

        return transaction;
    }

    async createTransactionForNewDelegationContractFromValidatorData(
        sender: Address,
        options: resources.NewDelegationContractInput,
    ): Promise<Transaction> {
        let dataParts = [
            "makeNewContractFromValidatorData",
            ...this.argSerializer.valuesToStrings([new BigUIntValue(options.maxCap), new BigUIntValue(options.fee)]),
        ];

        const transaction = new Transaction({
            sender,
            receiver: Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX, this.config.addressHrp),
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitForCreatingDelegationContractFromValidator);

        return transaction;
    }

    async createTransactionForMergingValidatorToDelegationWithWhitelist(
        sender: Address,
        options: resources.MergeValidatorToDelegationInput,
    ): Promise<Transaction> {
        let dataParts = [
            "mergeValidatorToDelegationWithWhitelist",
            this.argSerializer.valuesToStrings([new AddressValue(options.delegationAddress)])[0],
        ];

        const transaction = new Transaction({
            sender,
            receiver: Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX, this.config.addressHrp),
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitForWhitelistForMerge);

        return transaction;
    }

    async createTransactionForMergingValidatorToDelegationSameOwner(
        sender: Address,
        options: resources.MergeValidatorToDelegationInput,
    ): Promise<Transaction> {
        let dataParts = [
            "mergeValidatorToDelegationSameOwner",
            this.argSerializer.valuesToStrings([new AddressValue(options.delegationAddress)])[0],
        ];

        const transaction = new Transaction({
            sender,
            receiver: Address.newFromHex(DELEGATION_MANAGER_SC_ADDRESS_HEX, this.config.addressHrp),
            chainID: this.config.chainID,
            gasLimit: 0n,
        });

        this.setTransactionPayload(transaction, dataParts);
        await this.setGasLimit(transaction, undefined, this.config.gasLimitForMergingValidatorToDelegation);

        return transaction;
    }
}
