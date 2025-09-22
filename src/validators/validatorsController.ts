import {
    Address,
    BaseController,
    BaseControllerInput,
    IAccount,
    IGasLimitEstimator,
    Transaction,
    TransactionsFactoryConfig,
} from "../core";
import { INetworkProvider } from "../networkProviders";
import * as resources from "./resources";
import { ValidatorsTransactionsFactory } from "./validatorsTransactionsFactory";

export class ValidatorsController extends BaseController {
    private factory: ValidatorsTransactionsFactory;

    constructor(options: {
        chainID: string;
        networkProvider: INetworkProvider;
        gasLimitEstimator?: IGasLimitEstimator;
    }) {
        super();
        this.factory = new ValidatorsTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: options.chainID }),
            gasLimitEstimator: options.gasLimitEstimator,
        });
    }

    async createTransactionForStaking(
        sender: IAccount,
        nonce: bigint,
        options: resources.StakingInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = await this.factory.createTransactionForStaking(sender.address, options);

        await this.setupAndSignTransaction(transaction, options, nonce, sender);

        return transaction;
    }

    async createTransactionForToppingUp(
        sender: IAccount,
        nonce: bigint,
        options: resources.ToppingUpInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = await this.factory.createTransactionForToppingUp(sender.address, options);

        await this.setupAndSignTransaction(transaction, options, nonce, sender);

        return transaction;
    }

    async createTransactionForUnstaking(
        sender: IAccount,
        nonce: bigint,
        options: resources.UnstakingInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = await this.factory.createTransactionForUnstaking(sender.address, options);

        await this.setupAndSignTransaction(transaction, options, nonce, sender);

        return transaction;
    }

    async createTransactionForUnjailing(
        sender: IAccount,
        nonce: bigint,
        options: resources.UnjailingInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = await this.factory.createTransactionForUnjailing(sender.address, options);

        await this.setupAndSignTransaction(transaction, options, nonce, sender);

        return transaction;
    }

    async createTransactionForUnbonding(
        sender: IAccount,
        nonce: bigint,
        options: resources.UnbondingInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = await this.factory.createTransactionForUnbonding(sender.address, options);

        await this.setupAndSignTransaction(transaction, options, nonce, sender);

        return transaction;
    }

    async createTransactionForChangingRewardsAddress(
        sender: IAccount,
        nonce: bigint,
        options: resources.ChangingRewardsAddressInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = await this.factory.createTransactionForChangingRewardsAddress(sender.address, options);

        await this.setupAndSignTransaction(transaction, options, nonce, sender);

        return transaction;
    }

    async createTransactionForClaiming(
        sender: IAccount,
        nonce: bigint,
        options: BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = await this.factory.createTransactionForClaiming(sender.address);

        await this.setupAndSignTransaction(transaction, options, nonce, sender);

        return transaction;
    }

    async createTransactionForUnstakingNodes(
        sender: IAccount,
        nonce: bigint,
        options: resources.UnstakingInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = await this.factory.createTransactionForUnstakingNodes(sender.address, options);

        await this.setupAndSignTransaction(transaction, options, nonce, sender);

        return transaction;
    }

    async createTransactionForUnstakingTokens(
        sender: IAccount,
        nonce: bigint,
        options: resources.UnstakingTokensInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = await this.factory.createTransactionForUnstakingTokens(sender.address, options);

        await this.setupAndSignTransaction(transaction, options, nonce, sender);

        return transaction;
    }

    async createTransactionForUnbondingNodes(
        sender: IAccount,
        nonce: bigint,
        options: resources.UnbondingInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = await this.factory.createTransactionForUnbondingNodes(sender.address, options);

        await this.setupAndSignTransaction(transaction, options, nonce, sender);

        return transaction;
    }

    async createTransactionForUnbondingTokens(
        sender: IAccount,
        nonce: bigint,
        options: resources.UnbondingTokensInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = await this.factory.createTransactionForUnbondingTokens(sender.address, options);

        await this.setupAndSignTransaction(transaction, options, nonce, sender);

        return transaction;
    }

    async createTransactionForCleaningRegisteredData(
        sender: IAccount,
        nonce: bigint,
        options: BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = await this.factory.createTransactionForCleaningRegisteredData(sender.address);

        await this.setupAndSignTransaction(transaction, options, nonce, sender);

        return transaction;
    }

    async createTransactionForRestakingUnstakedNodes(
        sender: IAccount,
        nonce: bigint,
        options: resources.RestakingInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = await this.factory.createTransactionForRestakingUnstakedNodes(sender.address, options);

        await this.setupAndSignTransaction(transaction, options, nonce, sender);

        return transaction;
    }

    async createTransactionForNewDelegationContractFromValidatorData(
        sender: IAccount,
        nonce: bigint,
        options: resources.NewDelegationContractInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = await this.factory.createTransactionForNewDelegationContractFromValidatorData(
            sender.address,
            options,
        );

        await this.setupAndSignTransaction(transaction, options, nonce, sender);

        return transaction;
    }

    async createTransactionForMergingValidatorToDelegationWithWhitelist(
        sender: IAccount,
        nonce: bigint,
        options: resources.MergeValidatorToDelegationInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = await this.factory.createTransactionForMergingValidatorToDelegationWithWhitelist(
            sender.address,
            options,
        );

        await this.setupAndSignTransaction(transaction, options, nonce, sender);

        return transaction;
    }

    async createTransactionForMergingValidatorToDelegationSameOwner(
        sender: IAccount,
        nonce: bigint,
        options: resources.MergeValidatorToDelegationInput & BaseControllerInput,
    ): Promise<Transaction> {
        const transaction = await this.factory.createTransactionForMergingValidatorToDelegationSameOwner(
            sender.address,
            options,
        );

        await this.setupAndSignTransaction(transaction, options, nonce, sender);

        return transaction;
    }

    private async setupAndSignTransaction(
        transaction: Transaction,
        options: BaseControllerInput,
        nonce: bigint,
        sender: IAccount,
    ) {
        transaction.guardian = options.guardian ?? Address.empty();
        transaction.relayer = options.relayer ?? Address.empty();
        transaction.nonce = nonce;
        this.setTransactionGasOptions(transaction, options);
        this.setVersionAndOptionsForGuardian(transaction);
        transaction.signature = await sender.signTransaction(transaction);
    }
}
