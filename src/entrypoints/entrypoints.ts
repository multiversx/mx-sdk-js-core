import { Abi } from "../abi";
import { AccountController, AccountTransactionsFactory } from "../accountManagement";
import { Account } from "../accounts";
import {
    Address,
    ErrInvalidNetworkProviderKind,
    IAccount,
    Message,
    Transaction,
    TransactionOnNetwork,
    TransactionsFactoryConfig,
    TransactionWatcher,
} from "../core";
import { DelegationController, DelegationTransactionsFactory } from "../delegation";
import { GasLimitEstimator } from "../gasEstimator";
import { GovernanceController, GovernanceTransactionsFactory } from "../governance";
import { MultisigTransactionsFactory } from "../multisig";
import { MultisigController } from "../multisig/multisigController";
import { ApiNetworkProvider, ProxyNetworkProvider } from "../networkProviders";
import { INetworkProvider } from "../networkProviders/interface";
import { SmartContractTransactionsFactory } from "../smartContracts";
import { SmartContractController } from "../smartContracts/smartContractController";
import { TokenManagementController, TokenManagementTransactionsFactory } from "../tokenManagement";
import { TransfersController, TransferTransactionsFactory } from "../transfers";
import { UserSecretKey } from "../wallet";
import { DevnetEntrypointConfig, MainnetEntrypointConfig, TestnetEntrypointConfig } from "./config";

export class NetworkEntrypoint {
    private networkProvider: INetworkProvider;
    private chainId: string;
    private gasLimitMultiplier?: number;

    constructor(options: {
        networkProviderUrl: string;
        networkProviderKind: string;
        chainId: string;
        clientName?: string;
        gasLimitMultiplier?: number;
    }) {
        if (options.networkProviderKind === "proxy") {
            this.networkProvider = new ProxyNetworkProvider(options.networkProviderUrl, {
                clientName: options.clientName,
            });
        } else if (options.networkProviderKind === "api") {
            this.networkProvider = new ApiNetworkProvider(options.networkProviderUrl, {
                clientName: options.clientName,
            });
        } else {
            throw new ErrInvalidNetworkProviderKind();
        }

        this.chainId = options.chainId;
        this.gasLimitMultiplier = options.gasLimitMultiplier;
    }

    /**
     * Creates a new Account by generating a new secret key and instantiating an UserSigner
     */
    async createAccount(): Promise<Account> {
        const secretKey = UserSecretKey.generate();
        return new Account(secretKey);
    }

    /**
     * Calls a faucet
     */
    async getAirdrop(_address: Address): Promise<void> {
        throw new Error("Not implemented");
    }

    async signTransaction(transaction: Transaction, account: IAccount): Promise<void> {
        transaction.signature = await account.signTransaction(transaction);
    }

    /**
     * Verifies if the signature field is valid
     * @param transaction
     * @param account
     */
    async verifyTransactionSignature(transaction: Transaction, account: IAccount): Promise<boolean> {
        return await account.verifyTransactionSignature(transaction, transaction.signature);
    }

    /**
     * Verifies if message signature is valid
     * @param message
     * @param account
     */
    async verifyMessageSignature(message: Message, account: IAccount): Promise<boolean> {
        if (!message.address) {
            throw new Error("`address` property of Message is not set");
        }

        if (!message.signature) {
            throw new Error("`signature` property of Message is not set");
        }

        return await account.verifyMessageSignature(message, message.signature);
    }

    /**
     * Fetches the account nonce from the network.
     * @param address
     */
    async recallAccountNonce(address: Address): Promise<bigint> {
        return (await this.networkProvider.getAccount(address)).nonce;
    }

    /**
     * Function of the network provider, promoted to the entrypoint.
     * @param transactions
     */
    sendTransactions(transactions: Transaction[]): Promise<[number, string[]]> {
        return this.networkProvider.sendTransactions(transactions);
    }

    /**
     * Function of the network provider, promoted to the entrypoint.
     * @param transaction
     */
    sendTransaction(transaction: Transaction): Promise<string> {
        return this.networkProvider.sendTransaction(transaction);
    }

    /**
     * Generic function to await a transaction on the network.
     * @param txHash
     */
    async awaitCompletedTransaction(txHash: string): Promise<TransactionOnNetwork> {
        const transactionAwaiter = new TransactionWatcher(this.networkProvider);
        return transactionAwaiter.awaitCompleted(txHash);
    }

    getTransaction(txHash: string): Promise<TransactionOnNetwork> {
        return this.networkProvider.getTransaction(txHash);
    }

    /**
     * Access to the underlying network provider.
     */
    createNetworkProvider(): INetworkProvider {
        return this.networkProvider;
    }

    createDelegationController(): DelegationController {
        const gasLimitEstimator = new GasLimitEstimator({
            networkProvider: this.networkProvider,
            gasMultiplier: this.gasLimitMultiplier,
        });
        return new DelegationController({
            chainID: this.chainId,
            networkProvider: this.networkProvider,
            gasLimitEstimator: gasLimitEstimator,
        });
    }

    createDelegationTransactionsFactory(): DelegationTransactionsFactory {
        const gasLimitEstimator = new GasLimitEstimator({
            networkProvider: this.networkProvider,
            gasMultiplier: this.gasLimitMultiplier,
        });
        return new DelegationTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: this.chainId }),
            gasLimitEstimator: gasLimitEstimator,
        });
    }

    createAccountController(): AccountController {
        const gasLimitEstimator = new GasLimitEstimator({
            networkProvider: this.networkProvider,
            gasMultiplier: this.gasLimitMultiplier,
        });
        return new AccountController({ chainID: this.chainId, gasLimitEstimator: gasLimitEstimator });
    }

    createAccountTransactionsFactory(): AccountTransactionsFactory {
        const gasLimitEstimator = new GasLimitEstimator({
            networkProvider: this.networkProvider,
            gasMultiplier: this.gasLimitMultiplier,
        });
        return new AccountTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: this.chainId }),
            gasLimitEstimator: gasLimitEstimator,
        });
    }

    createSmartContractController(abi?: Abi): SmartContractController {
        const gasLimitEstimator = new GasLimitEstimator({
            networkProvider: this.networkProvider,
            gasMultiplier: this.gasLimitMultiplier,
        });
        return new SmartContractController({
            chainID: this.chainId,
            networkProvider: this.networkProvider,
            abi,
            gasLimitEstimator: gasLimitEstimator,
        });
    }

    createSmartContractTransactionsFactory(abi?: Abi): SmartContractTransactionsFactory {
        const gasLimitEstimator = new GasLimitEstimator({
            networkProvider: this.networkProvider,
            gasMultiplier: this.gasLimitMultiplier,
        });
        return new SmartContractTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: this.chainId }),
            abi: abi,
            gasLimitEstimator: gasLimitEstimator,
        });
    }

    createTokenManagementController(): TokenManagementController {
        const gasLimitEstimator = new GasLimitEstimator({
            networkProvider: this.networkProvider,
            gasMultiplier: this.gasLimitMultiplier,
        });
        return new TokenManagementController({
            chainID: this.chainId,
            networkProvider: this.networkProvider,
            gasLimitEstimator: gasLimitEstimator,
        });
    }

    createTokenManagementTransactionsFactory(): TokenManagementTransactionsFactory {
        const gasLimitEstimator = new GasLimitEstimator({
            networkProvider: this.networkProvider,
            gasMultiplier: this.gasLimitMultiplier,
        });
        return new TokenManagementTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: this.chainId }),
            gasLimitEstimator: gasLimitEstimator,
        });
    }

    createTransfersController(): TransfersController {
        const gasLimitEstimator = new GasLimitEstimator({
            networkProvider: this.networkProvider,
            gasMultiplier: this.gasLimitMultiplier,
        });
        return new TransfersController({ chainID: this.chainId, gasLimitEstimator: gasLimitEstimator });
    }

    createTransfersTransactionsFactory(): TransferTransactionsFactory {
        const gasLimitEstimator = new GasLimitEstimator({
            networkProvider: this.networkProvider,
            gasMultiplier: this.gasLimitMultiplier,
        });
        return new TransferTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: this.chainId }),
            gasLimitEstimator: gasLimitEstimator,
        });
    }

    createMultisigController(abi: Abi): MultisigController {
        const gasLimitEstimator = new GasLimitEstimator({
            networkProvider: this.networkProvider,
            gasMultiplier: this.gasLimitMultiplier,
        });
        return new MultisigController({
            chainID: this.chainId,
            networkProvider: this.networkProvider,
            abi: abi,
            gasLimitEstimator: gasLimitEstimator,
        });
    }

    createMultisigTransactionsFactory(abi: Abi): MultisigTransactionsFactory {
        const gasLimitEstimator = new GasLimitEstimator({
            networkProvider: this.networkProvider,
            gasMultiplier: this.gasLimitMultiplier,
        });
        return new MultisigTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: this.chainId }),
            abi: abi,
            gasLimitEstimator: gasLimitEstimator,
        });
    }

    createGovernanceController(): GovernanceController {
        const gasLimitEstimator = new GasLimitEstimator({
            networkProvider: this.networkProvider,
            gasMultiplier: this.gasLimitMultiplier,
        });
        return new GovernanceController({
            chainID: this.chainId,
            networkProvider: this.networkProvider,
            gasLimitEstimator: gasLimitEstimator,
        });
    }

    createGovernanceTransactionsFactory(): GovernanceTransactionsFactory {
        const gasLimitEstimator = new GasLimitEstimator({
            networkProvider: this.networkProvider,
            gasMultiplier: this.gasLimitMultiplier,
        });
        return new GovernanceTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: this.chainId }),
            gasLimitEstimator: gasLimitEstimator,
        });
    }
}

export class TestnetEntrypoint extends NetworkEntrypoint {
    constructor(url?: string, kind?: string, clientName?: string, gasLimitMultiplier?: number) {
        const entrypointConfig = new TestnetEntrypointConfig();
        super({
            networkProviderUrl: url || entrypointConfig.networkProviderUrl,
            networkProviderKind: kind || entrypointConfig.networkProviderKind,
            chainId: entrypointConfig.chainId,
            clientName: clientName,
            gasLimitMultiplier: gasLimitMultiplier,
        });
    }
}

export class DevnetEntrypoint extends NetworkEntrypoint {
    constructor(url?: string, kind?: string, clientName?: string, gasLimitMultiplier?: number) {
        const entrypointConfig = new DevnetEntrypointConfig();
        super({
            networkProviderUrl: url || entrypointConfig.networkProviderUrl,
            networkProviderKind: kind || entrypointConfig.networkProviderKind,
            chainId: entrypointConfig.chainId,
            clientName: clientName,
            gasLimitMultiplier: gasLimitMultiplier,
        });
    }
}

export class MainnetEntrypoint extends NetworkEntrypoint {
    constructor(url?: string, kind?: string, clientName?: string, gasLimitMultiplier?: number) {
        const entrypointConfig = new MainnetEntrypointConfig();
        super({
            networkProviderUrl: url || entrypointConfig.networkProviderUrl,
            networkProviderKind: kind || entrypointConfig.networkProviderKind,
            chainId: entrypointConfig.chainId,
            clientName: clientName,
            gasLimitMultiplier: gasLimitMultiplier,
        });
    }
}
