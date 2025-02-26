import { AbiRegistry } from "../abi";
import { AccountController, AccountTransactionsFactory } from "../accountManagement";
import { Account } from "../accounts";
import { IAccount } from "../accounts/interfaces";
import { Address } from "../core/address";
import { ErrInvalidNetworkProviderKind } from "../core/errors";
import { Message } from "../core/message";
import { Transaction } from "../core/transaction";
import { TransactionOnNetwork } from "../core/transactionOnNetwork";
import { TransactionsFactoryConfig } from "../core/transactionsFactoryConfig";
import { TransactionWatcher } from "../core/transactionWatcher";
import { DelegationController, DelegationTransactionsFactory } from "../delegation";
import { ApiNetworkProvider, ProxyNetworkProvider } from "../networkProviders";
import { INetworkProvider } from "../networkProviders/interface";
import { SmartContractTransactionsFactory } from "../smartContracts";
import { SmartContractController } from "../smartContracts/smartContractController";
import { TokenManagementController, TokenManagementTransactionsFactory } from "../tokenManagement";
import { TransferTransactionsFactory } from "../transfers";
import { TransfersController } from "../transfers/transfersControllers";
import { UserSecretKey } from "../wallet";
import { DevnetEntrypointConfig, MainnetEntrypointConfig, TestnetEntrypointConfig } from "./config";

class NetworkEntrypoint {
    private networkProvider: INetworkProvider;
    private chainId: string;

    constructor(options: { networkProviderUrl: string; networkProviderKind: string; chainId: string }) {
        if (options.networkProviderKind === "proxy") {
            this.networkProvider = new ProxyNetworkProvider(options.networkProviderUrl);
        } else if (options.networkProviderKind === "api") {
            this.networkProvider = new ApiNetworkProvider(options.networkProviderUrl);
        } else {
            throw new ErrInvalidNetworkProviderKind();
        }

        this.chainId = options.chainId;
    }

    async createAccount(): Promise<Account> {
        const secretKey = UserSecretKey.generate();
        return new Account(secretKey);
    }

    async getAirdrop(_address: Address): Promise<void> {
        throw new Error("Not implemented");
    }

    async signTransaction(transaction: Transaction, account: IAccount): Promise<void> {
        transaction.signature = await account.signTransaction(transaction);
    }

    async verifyTransactionSignature(transaction: Transaction, account: IAccount): Promise<boolean> {
        return await account.verifyTransactionSignature(transaction, transaction.signature);
    }

    async verifyMessageSignature(message: Message, account: IAccount): Promise<boolean> {
        if (!message.address) {
            throw new Error("`address` property of Message is not set");
        }

        if (!message.signature) {
            throw new Error("`signature` property of Message is not set");
        }

        return await account.verifyMessageSignature(message, message.signature);
    }

    async recallAccountNonce(address: Address): Promise<bigint> {
        return (await this.networkProvider.getAccount(address)).nonce;
    }

    sendTransactions(transactions: Transaction[]): Promise<[number, string[]]> {
        return this.networkProvider.sendTransactions(transactions);
    }

    sendTransaction(transaction: Transaction): Promise<string> {
        return this.networkProvider.sendTransaction(transaction);
    }

    async awaitCompletedTransaction(txHash: string): Promise<TransactionOnNetwork> {
        const transactionAwaiter = new TransactionWatcher(this.networkProvider);
        return transactionAwaiter.awaitCompleted(txHash);
    }

    getTransaction(txHash: string): Promise<TransactionOnNetwork> {
        return this.networkProvider.getTransaction(txHash);
    }

    createNetworkProvider(): INetworkProvider {
        return this.networkProvider;
    }

    createDelegationController(): DelegationController {
        return new DelegationController({ chainID: this.chainId, networkProvider: this.networkProvider });
    }

    createDelegationTransactionsFactory(): DelegationTransactionsFactory {
        return new DelegationTransactionsFactory({ config: new TransactionsFactoryConfig({ chainID: this.chainId }) });
    }

    createAccountController(): AccountController {
        return new AccountController({ chainID: this.chainId });
    }

    createAccountTransactionsFactory(): AccountTransactionsFactory {
        return new AccountTransactionsFactory({ config: new TransactionsFactoryConfig({ chainID: this.chainId }) });
    }

    createSmartContractController(abi?: AbiRegistry): SmartContractController {
        return new SmartContractController({ chainID: this.chainId, networkProvider: this.networkProvider, abi });
    }

    createSmartContractTransactionsFactory(): SmartContractTransactionsFactory {
        return new SmartContractTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: this.chainId }),
        });
    }

    createTokenManagementController(): TokenManagementController {
        return new TokenManagementController({ chainID: this.chainId, networkProvider: this.networkProvider });
    }

    createTokenManagementTransactionsFactory(): TokenManagementTransactionsFactory {
        return new TokenManagementTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: this.chainId }),
        });
    }

    createTransfersController(): TransfersController {
        return new TransfersController({ chainID: this.chainId });
    }

    createTransfersTransactionsFactory(): TransferTransactionsFactory {
        return new TransferTransactionsFactory({
            config: new TransactionsFactoryConfig({ chainID: this.chainId }),
        });
    }
}

export class TestnetEntrypoint extends NetworkEntrypoint {
    constructor(url?: string, kind?: string) {
        const entrypointConfig = new TestnetEntrypointConfig();
        super({
            networkProviderUrl: url || entrypointConfig.networkProviderUrl,
            networkProviderKind: kind || entrypointConfig.networkProviderKind,
            chainId: entrypointConfig.chainId,
        });
    }
}

export class DevnetEntrypoint extends NetworkEntrypoint {
    constructor(url?: string, kind?: string) {
        const entrypointConfig = new DevnetEntrypointConfig();
        super({
            networkProviderUrl: url || entrypointConfig.networkProviderUrl,
            networkProviderKind: kind || entrypointConfig.networkProviderKind,
            chainId: entrypointConfig.chainId,
        });
    }
}

export class MainnetEntrypoint extends NetworkEntrypoint {
    constructor(url?: string, kind?: string) {
        const entrypointConfig = new MainnetEntrypointConfig();
        super({
            networkProviderUrl: url || entrypointConfig.networkProviderUrl,
            networkProviderKind: kind || entrypointConfig.networkProviderKind,
            chainId: entrypointConfig.chainId,
        });
    }
}
