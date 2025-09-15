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
import { ApiNetworkProvider, NetworkProviderConfig, ProxyNetworkProvider } from "../networkProviders";
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
    private withGasLimitEstimator?: boolean;
    private gasLimitMultiplier?: number;

    constructor(options: {
        networkProviderUrl: string;
        networkProviderKind: string;
        networkProviderConfig?: NetworkProviderConfig;
        chainId: string;
        clientName?: string;
        withGasLimitEstimator?: boolean;
        gasLimitMultiplier?: number;
    }) {
        const networkProviderConfig: NetworkProviderConfig = {
            ...(options.networkProviderConfig ?? {}),
            ...(options.clientName && { clientName: options.clientName }),
        };

        if (options.networkProviderKind === "proxy") {
            this.networkProvider = new ProxyNetworkProvider(options.networkProviderUrl, networkProviderConfig);
        } else if (options.networkProviderKind === "api") {
            this.networkProvider = new ApiNetworkProvider(options.networkProviderUrl, networkProviderConfig);
        } else {
            throw new ErrInvalidNetworkProviderKind();
        }

        this.chainId = options.chainId;
        this.withGasLimitEstimator = options.withGasLimitEstimator;
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

    protected createGasLimitEstimator(): GasLimitEstimator {
        return new GasLimitEstimator({
            networkProvider: this.networkProvider,
            gasMultiplier: this.gasLimitMultiplier,
        });
    }

    createDelegationController(): DelegationController {
        return new DelegationController({
            chainID: this.chainId,
            networkProvider: this.networkProvider,
            gasLimitEstimator: this.withGasLimitEstimator ? this.createGasLimitEstimator() : undefined,
        });
    }

    createDelegationTransactionsFactory(): DelegationTransactionsFactory {
        return new DelegationTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: this.chainId }),
            gasLimitEstimator: this.withGasLimitEstimator ? this.createGasLimitEstimator() : undefined,
        });
    }

    createAccountController(): AccountController {
        return new AccountController({
            chainID: this.chainId,
            gasLimitEstimator: this.withGasLimitEstimator ? this.createGasLimitEstimator() : undefined,
        });
    }

    createAccountTransactionsFactory(): AccountTransactionsFactory {
        return new AccountTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: this.chainId }),
            gasLimitEstimator: this.withGasLimitEstimator ? this.createGasLimitEstimator() : undefined,
        });
    }

    createSmartContractController(abi?: Abi): SmartContractController {
        return new SmartContractController({
            chainID: this.chainId,
            networkProvider: this.networkProvider,
            abi,
            gasLimitEstimator: this.withGasLimitEstimator ? this.createGasLimitEstimator() : undefined,
        });
    }

    createSmartContractTransactionsFactory(abi?: Abi): SmartContractTransactionsFactory {
        return new SmartContractTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: this.chainId }),
            abi: abi,
            gasLimitEstimator: this.withGasLimitEstimator ? this.createGasLimitEstimator() : undefined,
        });
    }

    createTokenManagementController(): TokenManagementController {
        return new TokenManagementController({
            chainID: this.chainId,
            networkProvider: this.networkProvider,
            gasLimitEstimator: this.withGasLimitEstimator ? this.createGasLimitEstimator() : undefined,
        });
    }

    createTokenManagementTransactionsFactory(): TokenManagementTransactionsFactory {
        return new TokenManagementTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: this.chainId }),
            gasLimitEstimator: this.withGasLimitEstimator ? this.createGasLimitEstimator() : undefined,
        });
    }

    createTransfersController(): TransfersController {
        return new TransfersController({
            chainID: this.chainId,
            gasLimitEstimator: this.withGasLimitEstimator ? this.createGasLimitEstimator() : undefined,
        });
    }

    createTransfersTransactionsFactory(): TransferTransactionsFactory {
        return new TransferTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: this.chainId }),
            gasLimitEstimator: this.withGasLimitEstimator ? this.createGasLimitEstimator() : undefined,
        });
    }

    createMultisigController(abi: Abi): MultisigController {
        return new MultisigController({
            chainID: this.chainId,
            networkProvider: this.networkProvider,
            abi: abi,
            gasLimitEstimator: this.withGasLimitEstimator ? this.createGasLimitEstimator() : undefined,
        });
    }

    createMultisigTransactionsFactory(abi: Abi): MultisigTransactionsFactory {
        return new MultisigTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: this.chainId }),
            abi: abi,
            gasLimitEstimator: this.withGasLimitEstimator ? this.createGasLimitEstimator() : undefined,
        });
    }

    createGovernanceController(): GovernanceController {
        return new GovernanceController({
            chainID: this.chainId,
            networkProvider: this.networkProvider,
            gasLimitEstimator: this.withGasLimitEstimator ? this.createGasLimitEstimator() : undefined,
        });
    }

    createGovernanceTransactionsFactory(): GovernanceTransactionsFactory {
        return new GovernanceTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: this.chainId }),
            gasLimitEstimator: this.withGasLimitEstimator ? this.createGasLimitEstimator() : undefined,
        });
    }
}

export class TestnetEntrypoint extends NetworkEntrypoint {
    constructor(options?: {
        url?: string;
        kind?: string;
        clientName?: string;
        withGasLimitEstimator?: boolean;
        gasLimitMultiplier?: number;
        networkProviderConfig?: NetworkProviderConfig;
    }) {
        const entrypointConfig = new TestnetEntrypointConfig();
        options = options || {};
        super({
            networkProviderUrl: options.url || entrypointConfig.networkProviderUrl,
            networkProviderKind: options.kind || entrypointConfig.networkProviderKind,
            networkProviderConfig: options.networkProviderConfig,
            chainId: entrypointConfig.chainId,
            clientName: options.clientName,
            withGasLimitEstimator: options.withGasLimitEstimator,
            gasLimitMultiplier: options.gasLimitMultiplier,
        });
    }
}

export class DevnetEntrypoint extends NetworkEntrypoint {
    constructor(options?: {
        url?: string;
        kind?: string;
        clientName?: string;
        withGasLimitEstimator?: boolean;
        gasLimitMultiplier?: number;
        networkProviderConfig?: NetworkProviderConfig;
    }) {
        const entrypointConfig = new DevnetEntrypointConfig();
        options = options || {};
        super({
            networkProviderUrl: options.url || entrypointConfig.networkProviderUrl,
            networkProviderKind: options.kind || entrypointConfig.networkProviderKind,
            networkProviderConfig: options.networkProviderConfig,
            chainId: entrypointConfig.chainId,
            clientName: options.clientName,
            withGasLimitEstimator: options.withGasLimitEstimator,
            gasLimitMultiplier: options.gasLimitMultiplier,
        });
    }
}

export class MainnetEntrypoint extends NetworkEntrypoint {
    constructor(options?: {
        url?: string;
        kind?: string;
        clientName?: string;
        withGasLimitEstimator?: boolean;
        gasLimitMultiplier?: number;
        networkProviderConfig?: NetworkProviderConfig;
    }) {
        const entrypointConfig = new MainnetEntrypointConfig();
        options = options || {};
        super({
            networkProviderUrl: options.url || entrypointConfig.networkProviderUrl,
            networkProviderKind: options.kind || entrypointConfig.networkProviderKind,
            networkProviderConfig: options.networkProviderConfig,
            chainId: entrypointConfig.chainId,
            clientName: options.clientName,
            withGasLimitEstimator: options.withGasLimitEstimator,
            gasLimitMultiplier: options.gasLimitMultiplier,
        });
    }
}
