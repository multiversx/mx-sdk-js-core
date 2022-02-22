import axios, { AxiosRequestConfig } from "axios";
import { AccountOnNetwork } from "../account";
import { Address } from "../address";
import { defaultConfig } from "../constants";
import { ErrApiProviderGet, ErrContractQuery } from "../errors";
import { IFungibleTokenOfAccountOnNetwork, INetworkProvider, INonFungibleTokenOfAccountOnNetwork, ITransactionOnNetwork, Pagination } from "../interface.networkProvider";
import { Logger } from "../logger";
import { NetworkConfig } from "../networkConfig";
import { NetworkStake } from "../networkStake";
import { NetworkStatus } from "../networkStatus";
import { NFTToken } from "../nftToken";
import { Nonce } from "../nonce";
import { Query, QueryResponse } from "../smartcontracts";
import { Stats } from "../stats";
import { Token } from "../token";
import { Transaction, TransactionHash, TransactionStatus } from "../transaction";
import { FungibleTokenOfAccountOnNetwork, NonFungibleTokenOfAccountOnNetwork } from "./tokens";
import { TransactionOnNetwork } from "./transactions";

export class ProxyNetworkProvider implements INetworkProvider {
    private url: string;
    private config: AxiosRequestConfig;

    /**
     * Creates a new {@link INetworkProvider} backed by an Elrond Proxy.
     * @param url the URL of the Elrond Proxy
     * @param config axios request config options
     */
    constructor(url: string, config?: AxiosRequestConfig) {
        this.url = url;
        this.config = { ...defaultConfig, ...config };
    }

    async getNetworkConfig(): Promise<NetworkConfig> {
        let response = await this.doGetGeneric("network/config");
        let networkConfig = NetworkConfig.fromHttpResponse(response.config);
        return networkConfig;
    }

    async getNetworkStatus(): Promise<NetworkStatus> {
        let response = await this.doGetGeneric("network/status/4294967295");
        let networkStatus = NetworkStatus.fromHttpResponse(response.status);
        return networkStatus;
    }

    async getNetworkStakeStatistics(): Promise<NetworkStake> {
        // TODO: Implement wrt.:
        // https://github.com/ElrondNetwork/api.elrond.com/blob/main/src/endpoints/stake/stake.service.ts
        throw new Error("Method not implemented.");
    }

    async getNetworkGeneralStatistics(): Promise<Stats> {
        // TODO: Implement wrt. (full implementation may not be possible):
        // https://github.com/ElrondNetwork/api.elrond.com/blob/main/src/endpoints/network/network.service.ts
        throw new Error("Method not implemented.");
    }

    async getAccount(address: Address): Promise<AccountOnNetwork> {
        let response = await this.doGetGeneric(`address/${address.bech32()}`);
        let account = AccountOnNetwork.fromHttpResponse(response.account);
        return account;
    }

    async getFungibleTokensOfAccount(address: Address, _pagination?: Pagination): Promise<IFungibleTokenOfAccountOnNetwork[]> {
        let url = `address/${address.bech32()}/esdt`;
        let response = await this.doGetGeneric(url);
        let responseItems: any[] = Object.values(response.esdts);
        // Skip NFTs / SFTs.
        let responseItemsFiltered = responseItems.filter(item => !item.nonce);
        let tokens = responseItemsFiltered.map(item => FungibleTokenOfAccountOnNetwork.fromHttpResponse(item));

        // TODO: Fix sorting
        tokens.sort((a, b) => a.tokenIdentifier.localeCompare(b.tokenIdentifier));
        return tokens;
    }

    async getNonFungibleTokensOfAccount(address: Address, _pagination?: Pagination): Promise<INonFungibleTokenOfAccountOnNetwork[]> {
        let url = `address/${address.bech32()}/esdt`;
        let response = await this.doGetGeneric(url);
        let responseItems: any[] = Object.values(response.esdts);
        // Skip fungible tokens.
        let responseItemsFiltered = responseItems.filter(item => item.nonce >= 0);
        let tokens = responseItemsFiltered.map(item => NonFungibleTokenOfAccountOnNetwork.fromProxyHttpResponse(item));

        // TODO: Fix sorting
        tokens.sort((a, b) => a.tokenIdentifier.localeCompare(b.tokenIdentifier));
        return tokens;
    }

    async getFungibleTokenOfAccount(address: Address, tokenIdentifier: string): Promise<IFungibleTokenOfAccountOnNetwork> {
        let response = await this.doGetGeneric(`address/${address.bech32()}/esdt/${tokenIdentifier}`);
        let tokenData = FungibleTokenOfAccountOnNetwork.fromHttpResponse(response.tokenData);
        return tokenData;
    }

    async getNonFungibleTokenOfAccount(address: Address, collection: string, nonce: Nonce): Promise<INonFungibleTokenOfAccountOnNetwork> {
        let response = await this.doGetGeneric(`address/${address.bech32()}/nft/${collection}/nonce/${nonce.valueOf()}`);
        let tokenData = NonFungibleTokenOfAccountOnNetwork.fromProxyHttpResponseByNonce(response.tokenData);
        return tokenData;
    }

    async getTransaction(txHash: TransactionHash): Promise<ITransactionOnNetwork> {
        let url = this.buildUrlWithQueryParameters(`transaction/${txHash.toString()}`, { withResults: "true" });
        let response = await this.doGetGeneric(url);
        let transaction = TransactionOnNetwork.fromProxyHttpResponse(txHash, response.transaction);
        return transaction;
    }

    async getTransactionStatus(txHash: TransactionHash): Promise<TransactionStatus> {
        let response = await this.doGetGeneric(`transaction/${txHash.toString()}/status`);
        let status = new TransactionStatus(response.status);
        return status;
    }

    async sendTransaction(tx: Transaction): Promise<TransactionHash> {
        let response = await this.doPostGeneric("transaction/send", tx.toSendable());
        let hash = new TransactionHash(response.txHash);
        return hash;
    }

    async simulateTransaction(tx: Transaction): Promise<any> {
        let response = await this.doPostGeneric("transaction/simulate", tx.toSendable());
        return response;
    }

    async queryContract(query: Query): Promise<QueryResponse> {
        try {
            let data = query.toHttpRequest();
            let response = await this.doPostGeneric("vm-values/query", data);
            let queryResponse = QueryResponse.fromHttpResponse(response.data)
            return queryResponse;
        } catch (err: any) {
            throw ErrContractQuery.increaseSpecificity(err);
        }
    }

    async getToken(_tokenIdentifier: string): Promise<Token> {
        // TODO: Implement wrt.:
        // https://github.com/ElrondNetwork/api.elrond.com/blob/main/src/endpoints/esdt/esdt.service.ts#L221
        throw new Error("Method not implemented.");
    }

    async getNFTToken(_tokenIdentifier: string): Promise<NFTToken> {
        // TODO: Implement wrt.:
        throw new Error("Method not implemented.");
    }

    async getDefinitionOfTokenCollection(_collection: string): Promise<any> {
        // TODO: Implement wrt.:
        // https://github.com/ElrondNetwork/api.elrond.com/blob/main/src/endpoints/collections/collection.service.ts
        // https://docs.elrond.com/developers/esdt-tokens/#get-esdt-token-properties
        throw new Error("Method not implemented.");
    }

    async doGetGeneric(resourceUrl: string): Promise<any> {
        let response = await this.doGet(resourceUrl);
        return response;
    }

    async doPostGeneric(resourceUrl: string, payload: any): Promise<any> {
        let response = await this.doPost(resourceUrl, payload);
        return response;
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
            throw new ErrApiProviderGet(resourceUrl, error.toString(), error);
        }

        let errorData = error.response.data;
        let originalErrorMessage = errorData.error || errorData.message || JSON.stringify(errorData);
        throw new ErrApiProviderGet(resourceUrl, originalErrorMessage, error);
    }
}
