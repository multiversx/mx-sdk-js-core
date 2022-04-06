import axios, { AxiosRequestConfig } from "axios";
import BigNumber from "bignumber.js";

import { IHash, IProvider } from "./interface";
import { Transaction, TransactionHash } from "./transaction";
import { Address } from "./address";
import * as errors from "./errors";
import { Query } from "./smartcontracts/query";
import { Logger } from "./logger";
import { defaultConfig } from "./constants";
import { ProxyNetworkProvider } from "./networkProvider/proxyNetworkProvider";
import { IAccountOnNetwork, IContractQueryResponse, IFungibleTokenOfAccountOnNetwork, INetworkConfig, INetworkStatus, ITransactionOnNetwork, ITransactionStatus } from "./interfaceOfNetwork";

export class ProxyProvider implements IProvider {
    private url: string;
    private config: AxiosRequestConfig;
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
        this.url = url;
        this.config = {...defaultConfig, ...config};
        this.backingProvider = new ProxyNetworkProvider(url, config);
    }

    /**
     * Fetches the state of an account.
     */
    async getAccount(address: Address): Promise<IAccountOnNetwork> {
        return await this.backingProvider.getAccount(address);
    }

    async getAddressEsdtList(address: Address): Promise<IFungibleTokenOfAccountOnNetwork[]> {
        return await this.backingProvider.getFungibleTokensOfAccount(address);
    }

    async getAddressEsdt(address: Address, tokenIdentifier: string): Promise<any> {
        return this.doGetGeneric(`address/${address.bech32()}/esdt/${tokenIdentifier}`, (response) =>
            response.tokenData
        );
    }

    async getAddressNft(address: Address, tokenIdentifier: string, nonce: BigNumber): Promise<any> {
        return this.doGetGeneric(`address/${address.bech32()}/nft/${tokenIdentifier}/nonce/${nonce}`, (response) =>
            response.tokenData
        );
    }

    /**
     * Queries a Smart Contract - runs a pure function defined by the contract and returns its results.
     */
    async queryContract(query: Query): Promise<IContractQueryResponse> {
        return await this.backingProvider.queryContract(query);
    }

    /**
     * Broadcasts an already-signed {@link Transaction}.
     */
    async sendTransaction(tx: Transaction): Promise<IHash> {
        return await this.backingProvider.sendTransaction(tx);
    }

    /**
     * Simulates the processing of an already-signed {@link Transaction}.
     */
    async simulateTransaction(tx: Transaction): Promise<any> {
        return await this.backingProvider.simulateTransaction(tx);
    }

    /**
     * Fetches the state of a {@link Transaction}.
     */
    async getTransaction(
        txHash: TransactionHash
    ): Promise<ITransactionOnNetwork> {
        return await this.backingProvider.getTransaction(txHash);
    }

    /**
     * Queries the status of a {@link Transaction}.
     */
    async getTransactionStatus(txHash: TransactionHash): Promise<ITransactionStatus> {
        return await this.backingProvider.getTransactionStatus(txHash);
    }

    /**
     * Fetches the Network configuration.
     */
    async getNetworkConfig(): Promise<INetworkConfig> {
        return await this.backingProvider.getNetworkConfig();
    }

    /**
     * Fetches the network status configuration.
     */
    async getNetworkStatus(): Promise<INetworkStatus> {
        return await this.backingProvider.getNetworkStatus();
    }

    /**
     * Get method that receives the resource url and on callback the method used to map the response.
     */
    async doGetGeneric(resourceUrl: string, callback: (response: any) => any): Promise<any> {
        let response = await this.doGet(resourceUrl);
        return callback(response);
    }

    /**
     * Post method that receives the resource url, the post payload and on callback the method used to map the response.
     */
    async doPostGeneric(resourceUrl: string, payload: any, callback: (response: any) => any): Promise<any> {
        let response = await this.doPost(resourceUrl, payload);
        return callback(response);
    }

    private async doGet(resourceUrl: string): Promise<any> {
        try {
            let url = `${this.url}/${resourceUrl}`;
            let response = await axios.get(url, this.config);
            let payload = response.data.data;
            return payload;
        } catch (error) {
            this.handleApiError(error, resourceUrl);
        }
    }

    private async doPost(resourceUrl: string, payload: any): Promise<any> {
        try {
            let url = `${this.url}/${resourceUrl}`;
            let response = await axios.post(url, payload, {
                ...this.config,
                headers: {
                    "Content-Type": "application/json",
                },
            });
            let responsePayload = response.data.data;
            return responsePayload;
        } catch (error) {
            this.handleApiError(error, resourceUrl);
        }
    }

    private buildUrlWithQueryParameters(endpoint: string, params: Record<string, string>): string {
        let searchParams = new URLSearchParams();

        for (let [key, value] of Object.entries(params)) {
            if (value) {
                searchParams.append(key, value);
            }
        }

        return `${endpoint}?${searchParams.toString()}`;
    }

    private handleApiError(error: any, resourceUrl: string) {
        if (!error.response) {
            Logger.warn(error);
            throw new errors.ErrApiProviderGet(resourceUrl, error.toString(), error);
        }

        let errorData = error.response.data;
        let originalErrorMessage = errorData.error || errorData.message || JSON.stringify(errorData);
        throw new errors.ErrApiProviderGet(resourceUrl, originalErrorMessage, error);
    }
}
