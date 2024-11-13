import { AbiRegistry } from "../abi";
import { IAccount } from "../accounts/interfaces";
import { Address } from "../address";
import { AccountController } from "../controllers/accountController";
import { DelegationController } from "../controllers/delegationController";
import { SmartContractController } from "../controllers/smartContractController";
import { TokenManagementController } from "../controllers/tokenManagementController";
import { TransfersController } from "../controllers/transfersController";
import { ErrInvalidNetworkProviderKind } from "../errors";
import { Message, MessageComputer } from "../message";
import { ApiNetworkProvider, ProxyNetworkProvider, TransactionOnNetwork } from "../networkProviders";
import { RelayedController } from "../relayed/relayedController";
import { Transaction } from "../transaction";
import { TransactionComputer } from "../transactionComputer";
import { TransactionWatcher } from "../transactionWatcher";
import { UserVerifier } from "../wallet";
import { DevnetEntrypointConfig, MainnetEntrypointConfig, TestnetEntrypointConfig } from "./config";
import { ProviderWrapper } from "./providerWrapper";

class NetworkEntrypoint {
    private networkProvider: ApiNetworkProvider | ProxyNetworkProvider;
    private chainId: string;

    constructor(networkProviderUrl: string, networkProviderKind: string, chainId: string) {
        if (networkProviderKind === "proxy") {
            this.networkProvider = new ProxyNetworkProvider(networkProviderUrl);
        } else if (networkProviderKind === "api") {
            this.networkProvider = new ApiNetworkProvider(networkProviderUrl);
        } else {
            throw new ErrInvalidNetworkProviderKind();
        }

        this.chainId = chainId;
    }

    async signTransaction(transaction: Transaction, account: IAccount): Promise<void> {
        const txComputer = new TransactionComputer();
        transaction.signature = await account.sign(txComputer.computeBytesForSigning(transaction));
    }

    verifyTransactionSignature(transaction: Transaction): boolean {
        const verifier = UserVerifier.fromAddress(Address.fromBech32(transaction.sender));
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

    async recallAccountNonce(address: Address): Promise<number> {
        return (await this.networkProvider.getAccount(address)).nonce;
    }

    sendTransactions(transactions: Transaction[]): Promise<string[]> {
        return this.networkProvider.sendTransactions(transactions);
    }

    sendTransaction(transaction: Transaction): Promise<string> {
        return this.networkProvider.sendTransaction(transaction);
    }

    async awaitCompletedTransaction(txHash: string): Promise<TransactionOnNetwork> {
        const provider = new ProviderWrapper(this.networkProvider);
        const transactionAwaiter = new TransactionWatcher(provider);
        return transactionAwaiter.awaitCompleted(txHash);
    }

    createNetworkProvider(): ApiNetworkProvider | ProxyNetworkProvider {
        return this.networkProvider;
    }

    createDelegationController(): DelegationController {
        return new DelegationController(this.chainId, this.networkProvider);
    }

    createAccountController(): AccountController {
        return new AccountController(this.chainId);
    }

    createRelayedController(): RelayedController {
        return new RelayedController(this.chainId);
    }

    createSmartContractController(abi?: AbiRegistry): SmartContractController {
        return new SmartContractController(this.chainId, this.networkProvider, abi);
    }

    createTokenManagementController(): TokenManagementController {
        return new TokenManagementController(this.chainId, this.networkProvider);
    }

    createTransfersController(): TransfersController {
        return new TransfersController(this.chainId);
    }
}

export class TestnetEntrypoint extends NetworkEntrypoint {
    constructor(url?: string, kind?: string) {
        const entrypointConfig = new TestnetEntrypointConfig();
        super(
            url || entrypointConfig.networkProviderUrl,
            kind || entrypointConfig.networkProviderKind,
            entrypointConfig.chainId,
        );
    }
}

export class DevnetEntrypoint extends NetworkEntrypoint {
    constructor(url?: string, kind?: string) {
        const entrypointConfig = new DevnetEntrypointConfig();
        super(
            url || entrypointConfig.networkProviderUrl,
            kind || entrypointConfig.networkProviderKind,
            entrypointConfig.chainId,
        );
    }
}

export class MainnetEntrypoint extends NetworkEntrypoint {
    constructor(url?: string, kind?: string) {
        const entrypointConfig = new MainnetEntrypointConfig();
        super(
            url || entrypointConfig.networkProviderUrl,
            kind || entrypointConfig.networkProviderKind,
            entrypointConfig.chainId,
        );
    }
}
