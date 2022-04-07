import { AxiosRequestConfig } from "axios";
import BigNumber from "bignumber.js";
import { IAddress, IContractQuery, IHash, ITransaction } from "./interface";
import { ProxyNetworkProvider } from "./proxyNetworkProvider";
import { ContractQueryResponse } from "./contractQueryResponse";
import { AccountOnNetwork } from "./accounts";
import { FungibleTokenOfAccountOnNetwork } from "./tokens";
import { TransactionStatus } from "./transactionStatus";
import { TransactionOnNetwork } from "./transactions";
import { NetworkConfig } from "./networkConfig";
import { NetworkStatus } from "./networkStatus";
import { Nonce } from "./primitives";

/**
 * @deprecated
 */
export class ProxyProvider {
    /**
     * @deprecated used only for preparatory refactoring (unifying network providers)
     */
    private readonly backingProvider: ProxyNetworkProvider;

    /**
     * Creates a new ProxyProvider.
     * @param url the URL of the Elrond Proxy
     * @param config axios request config options
     */
    constructor(url: string, config?: AxiosRequestConfig) {
        this.backingProvider = new ProxyNetworkProvider(url, config);
    }

    /**
     * Fetches the state of an account.
     */
    async getAccount(address: IAddress): Promise<AccountOnNetwork> {
        return await this.backingProvider.getAccount(address);
    }

    async getAddressEsdtList(address: IAddress): Promise<FungibleTokenOfAccountOnNetwork[]> {
        return await this.backingProvider.getFungibleTokensOfAccount(address);
    }

    async getAddressEsdt(address: IAddress, tokenIdentifier: string): Promise<any> {
        return await this.backingProvider.getFungibleTokenOfAccount(address, tokenIdentifier);
    }

    async getAddressNft(address: IAddress, tokenIdentifier: string, nonce: BigNumber): Promise<any> {
        return await this.backingProvider.getNonFungibleTokenOfAccount(address, tokenIdentifier, new Nonce(nonce.toNumber()));
    }

    /**
     * Queries a Smart Contract - runs a pure function defined by the contract and returns its results.
     */
    async queryContract(query: IContractQuery): Promise<ContractQueryResponse> {
        return await this.backingProvider.queryContract(query);
    }

    /**
     * Broadcasts an already-signed transaction.
     */
    async sendTransaction(tx: ITransaction): Promise<IHash> {
        return await this.backingProvider.sendTransaction(tx);
    }

    /**
     * Simulates the processing of an already-signed transaction.
     */
    async simulateTransaction(tx: ITransaction): Promise<any> {
        return await this.backingProvider.simulateTransaction(tx);
    }

    /**
     * Fetches the state of a transaction.
     */
    async getTransaction(txHash: IHash): Promise<TransactionOnNetwork> {
        return await this.backingProvider.getTransaction(txHash);
    }

    /**
     * Queries the status of a transaction.
     */
    async getTransactionStatus(txHash: IHash): Promise<TransactionStatus> {
        return await this.backingProvider.getTransactionStatus(txHash);
    }

    /**
     * Fetches the Network configuration.
     */
    async getNetworkConfig(): Promise<NetworkConfig> {
        return await this.backingProvider.getNetworkConfig();
    }

    /**
     * Fetches the network status configuration.
     */
    async getNetworkStatus(): Promise<NetworkStatus> {
        return await this.backingProvider.getNetworkStatus();
    }

    /**
     * Get method that receives the resource url and on callback the method used to map the response.
     */
    async doGetGeneric(resourceUrl: string): Promise<any> {
        return await this.backingProvider.doGetGeneric(resourceUrl);
    }

    /**
     * Post method that receives the resource url, the post payload and on callback the method used to map the response.
     */
    async doPostGeneric(resourceUrl: string, payload: any): Promise<any> {
        return await this.backingProvider.doPostGeneric(resourceUrl, payload);
    }
}
