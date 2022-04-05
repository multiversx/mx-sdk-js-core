import axios, { AxiosRequestConfig } from "axios";
import BigNumber from "bignumber.js";

import { IProvider } from "./interface";
import { Transaction, TransactionHash, TransactionStatus } from "./transaction";
import { NetworkConfig } from "./networkConfig";
import { Address } from "./address";
import * as errors from "./errors";
import { AccountOnNetwork, TokenOfAccountOnNetwork } from "./account";
import { Query } from "./smartcontracts/query";
import { QueryResponse } from "./smartcontracts/queryResponse";
import { Logger } from "./logger";
import { NetworkStatus } from "./networkStatus";
import { defaultConfig } from "./constants";
import { ProxyNetworkProvider } from "./networkProvider/proxyNetworkProvider";
import { ITransactionOnNetwork } from "./interfaceOfNetwork";

/**
 * This will be deprecated once all the endpoints move to ApiProvider
 */


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
     * Fetches the state of an {@link Account}.
     */
    async getAccount(address: Address): Promise<AccountOnNetwork> {
        return this.doGetGeneric(`address/${address.bech32()}`, (response) =>
            AccountOnNetwork.fromHttpResponse(response.account)
        );
    }

    async getAddressEsdtList(address: Address): Promise<TokenOfAccountOnNetwork[]> {
        let url = `address/${address.bech32()}/esdt`;
        let raw = await this.doGetGeneric(url, response => response.esdts);
        let tokens = Object.values(raw).map(item => TokenOfAccountOnNetwork.fromHttpResponse(item));
        return tokens;
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
    async queryContract(query: Query): Promise<QueryResponse> {
        try {
            let data = query.toHttpRequest();
            return this.doPostGeneric("vm-values/query", data, (response) =>
                QueryResponse.fromHttpResponse(response.data || response.vmOutput)
            );
        } catch (err: any) {
            throw errors.ErrContractQuery.increaseSpecificity(err);
        }
    }

    /**
     * Broadcasts an already-signed {@link Transaction}.
     */
    async sendTransaction(tx: Transaction): Promise<TransactionHash> {
        return this.doPostGeneric(
            "transaction/send",
            tx.toSendable(),
            (response) => new TransactionHash(response.txHash)
        );
    }

    /**
     * Simulates the processing of an already-signed {@link Transaction}.
     */
    async simulateTransaction(tx: Transaction): Promise<any> {
        return this.doPostGeneric("transaction/simulate", tx.toSendable(), (response) => response);
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
    async getTransactionStatus(txHash: TransactionHash): Promise<TransactionStatus> {
        return await this.backingProvider.getTransactionStatus(txHash);
    }

    /**
     * Fetches the Network configuration.
     */
    async getNetworkConfig(): Promise<NetworkConfig> {
        return this.doGetGeneric("network/config", (response) => NetworkConfig.fromHttpResponse(response.config));
    }

    /**
     * Fetches the network status configuration.
     */
    async getNetworkStatus(): Promise<NetworkStatus> {
        return this.doGetGeneric("network/status/4294967295", (response) =>
            NetworkStatus.fromHttpResponse(response.status)
        );
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
