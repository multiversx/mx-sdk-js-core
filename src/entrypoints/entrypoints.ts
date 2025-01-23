import { AbiRegistry } from "../abi";
import { AccountController, AccountTransactionsFactory } from "../accountManagement";
import { IAccount } from "../accounts/interfaces";
import { Address } from "../address";
import { DelegationController, DelegationTransactionsFactory } from "../delegation";
import { ErrInvalidNetworkProviderKind } from "../errors";
import { Message, MessageComputer } from "../message";
import { ApiNetworkProvider, ProxyNetworkProvider } from "../networkProviders";
import { INetworkProvider } from "../networkProviders/interface";
import { RelayedTransactionsFactory } from "../relayed";
import { RelayedController } from "../relayed/relayedController";
import { SmartContractTransactionsFactory } from "../smartContracts";
import { SmartContractController } from "../smartContracts/smartContractController";
import { TokenManagementController, TokenManagementTransactionsFactory } from "../tokenManagement";
import { Transaction } from "../transaction";
import { TransactionComputer } from "../transactionComputer";
import { TransactionOnNetwork } from "../transactionOnNetwork";
import { TransactionsFactoryConfig } from "../transactionsFactoryConfig";
import { TransactionWatcher } from "../transactionWatcher";
import { TransferTransactionsFactory } from "../transfers";
import { TransfersController } from "../transfers/transfersControllers";
import { UserVerifier } from "../wallet";
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

    async signTransaction(transaction: Transaction, account: IAccount): Promise<void> {
        const txComputer = new TransactionComputer();
        transaction.signature = await account.sign(txComputer.computeBytesForSigning(transaction));
    }

    verifyTransactionSignature(transaction: Transaction): boolean {
        const verifier = UserVerifier.fromAddress(transaction.sender);
        const txComputer = new TransactionComputer();
        return verifier.verify(txComputer.computeBytesForVerifying(transaction), transaction.signature);
    }

    async signMessage(message: Message, account: IAccount): Promise<void> {
        const messageComputer = new MessageComputer();
        message.signature = await account.sign(messageComputer.computeBytesForSigning(message));
    }

    verifyMessageSignature(message: Message): boolean {
        if (!message.address) {
            throw new Error("`address` property of Message is not set");
        }

        if (!message.signature) {
            throw new Error("`signature` property of Message is not set");
        }

        const verifier = UserVerifier.fromAddress(message.address);
        const messageComputer = new MessageComputer();
        return verifier.verify(messageComputer.computeBytesForVerifying(message), message.signature);
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

    createRelayedController(): RelayedController {
        return new RelayedController({ chainID: this.chainId });
    }

    createRelayedTransactionsFactory(): RelayedTransactionsFactory {
        return new RelayedTransactionsFactory({ config: new TransactionsFactoryConfig({ chainID: this.chainId }) });
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
