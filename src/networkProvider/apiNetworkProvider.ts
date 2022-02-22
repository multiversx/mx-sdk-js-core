import axios, { AxiosRequestConfig } from "axios";
import { AccountOnNetwork } from "../account";
import { Address } from "../address";
import { defaultConfig } from "../constants";
import { ErrApiProviderGet, ErrContractQuery } from "../errors";
import { IDefinitionOfFungibleTokenOnNetwork, IDefinitionOfTokenCollectionOnNetwork, IFungibleTokenOfAccountOnNetwork, INetworkProvider, INonFungibleTokenOfAccountOnNetwork, ITransactionOnNetwork, Pagination } from "../interface.networkProvider";
import { Logger } from "../logger";
import { NetworkConfig } from "../networkConfig";
import { NetworkStake } from "../networkStake";
import { NetworkStatus } from "../networkStatus";
import { Nonce } from "../nonce";
import { Query, QueryResponse } from "../smartcontracts";
import { Stats } from "../stats";
import { Transaction, TransactionHash, TransactionStatus } from "../transaction";
import { ProxyNetworkProvider } from "./proxyNetworkProvider";
import { DefinitionOfFungibleTokenOnNetwork, DefinitionOfTokenCollectionOnNetwork } from "./tokenDefinitions";
import { FungibleTokenOfAccountOnNetwork, NonFungibleTokenOfAccountOnNetwork } from "./tokens";
import { TransactionOnNetwork } from "./transactions";

export class ApiNetworkProvider implements INetworkProvider {
    private url: string;
    private config: AxiosRequestConfig;
    private backingProxyNetworkProvider;

    /**
     * Creates a new ApiProvider.
     * @param url the URL of the Elrond Api
     * @param config axios request config options
     */
    constructor(url: string, config?: AxiosRequestConfig) {
        this.url = url;
        this.config = { ...defaultConfig, ...config };
        this.backingProxyNetworkProvider = new ProxyNetworkProvider(url, config);
    }

    async getNetworkConfig(): Promise<NetworkConfig> {
        return await this.backingProxyNetworkProvider.getNetworkConfig();
    }

    async getNetworkStatus(): Promise<NetworkStatus> {
        return await this.backingProxyNetworkProvider.getNetworkStatus();
    }

    async getNetworkStakeStatistics(): Promise<NetworkStake> {
        let response = await this.doGetGeneric("stake");
        let networkStake = NetworkStake.fromHttpResponse(response)
        return networkStake;
    }

    async getNetworkGeneralStatistics(): Promise<Stats> {
        let response = await this.doGetGeneric("stats");
        let stats = Stats.fromHttpResponse(response)
        return stats;
    }

    async getAccount(address: Address): Promise<AccountOnNetwork> {
        let response = await this.doGetGeneric(`accounts/${address.bech32()}`);
        let account = AccountOnNetwork.fromHttpResponse(response);
        return account;
    }

    async getFungibleTokensOfAccount(address: Address, pagination?: Pagination): Promise<IFungibleTokenOfAccountOnNetwork[]> {
        pagination = pagination || Pagination.default();

        let url = `accounts/${address.bech32()}/tokens?${this.buildPaginationParams(pagination)}`;
        let response: any[] = await this.doGetGeneric(url);
        let tokens = response.map(item => FungibleTokenOfAccountOnNetwork.fromHttpResponse(item));

        // TODO: Fix sorting
        tokens.sort((a, b) => a.identifier.localeCompare(b.identifier));
        return tokens;
    }

    async getNonFungibleTokensOfAccount(address: Address, pagination?: Pagination): Promise<INonFungibleTokenOfAccountOnNetwork[]> {
        pagination = pagination || Pagination.default();

        let url = `accounts/${address.bech32()}/nfts?${this.buildPaginationParams(pagination)}`;
        let response: any[] = await this.doGetGeneric(url);
        let tokens = response.map(item => NonFungibleTokenOfAccountOnNetwork.fromApiHttpResponse(item));
        
        // TODO: Fix sorting
        tokens.sort((a, b) => a.identifier.localeCompare(b.identifier));
        return tokens;
    }

    async getFungibleTokenOfAccount(address: Address, tokenIdentifier: string): Promise<IFungibleTokenOfAccountOnNetwork> {
        let response = await this.doGetGeneric(`accounts/${address.bech32()}/tokens/${tokenIdentifier}`);
        let tokenData = FungibleTokenOfAccountOnNetwork.fromHttpResponse(response);
        return tokenData;
    }

    async getNonFungibleTokenOfAccount(address: Address, collection: string, nonce: Nonce): Promise<INonFungibleTokenOfAccountOnNetwork> {
        let response = await this.doGetGeneric(`accounts/${address.bech32()}/nfts/${collection}-${nonce.hex()}`);
        let tokenData = NonFungibleTokenOfAccountOnNetwork.fromApiHttpResponse(response);
        return tokenData;
    }

    async getTransaction(txHash: TransactionHash): Promise<ITransactionOnNetwork> {
        let response = await this.doGetGeneric(`transactions/${txHash.toString()}`);
        let transaction = TransactionOnNetwork.fromApiHttpResponse(txHash, response);
        return transaction;
    }

    async getTransactionStatus(txHash: TransactionHash): Promise<TransactionStatus> {
        let response = await this.doGetGeneric(`transactions/${txHash.toString()}?fields=status`);
        let status = new TransactionStatus(response.status);
        return status;
    }

    async sendTransaction(tx: Transaction): Promise<TransactionHash> {
        let response = await this.doPostGeneric("transactions", tx.toSendable());
        // Also see: https://github.com/ElrondNetwork/api.elrond.com/blob/main/src/endpoints/transactions/entities/transaction.send.result.ts
        let hash = new TransactionHash(response.txHash);
        return hash;
    }

    async simulateTransaction(tx: Transaction): Promise<any> {
        return await this.backingProxyNetworkProvider.simulateTransaction(tx);
    }

    async queryContract(query: Query): Promise<QueryResponse> {
        try {
            let data = query.toHttpRequest();
            let response = await this.doPostGeneric("query", data);
            let queryResponse = QueryResponse.fromHttpResponse(response)
            return queryResponse;
        } catch (err: any) {
            throw ErrContractQuery.increaseSpecificity(err);
        }
    }

    async getDefinitionOfFungibleToken(tokenIdentifier: string): Promise<IDefinitionOfFungibleTokenOnNetwork> {
        let response = await this.doGetGeneric(`tokens/${tokenIdentifier}`);
        let definition = DefinitionOfFungibleTokenOnNetwork.fromApiHttpResponse(response);
        return definition;
    }

    async getDefinitionOfTokenCollection(collection: string): Promise<IDefinitionOfTokenCollectionOnNetwork> {
        let response = await this.doGetGeneric(`collections/${collection}`);
        let definition = DefinitionOfTokenCollectionOnNetwork.fromApiHttpResponse(response);
        return definition;
    }

    async getNonFungibleToken(collection: string, nonce: Nonce): Promise<INonFungibleTokenOfAccountOnNetwork> {
        let response = await this.doGetGeneric(`nfts/${collection}-${nonce.hex()}`);
        let token = NonFungibleTokenOfAccountOnNetwork.fromApiHttpResponse(response);
        return token;
    }

    async doGetGeneric(resourceUrl: string): Promise<any> {
        let response = await this.doGet(resourceUrl);
        return response;
    }

    async doPostGeneric(resourceUrl: string, payload: any): Promise<any> {
        let response = await this.doPost(resourceUrl, payload);
        return response;
    }

    private buildPaginationParams(pagination: Pagination) {
        return `from=${pagination.from}&size=${pagination.size}`;
    }

    private async doGet(resourceUrl: string): Promise<any> {
        try {
            let url = `${this.url}/${resourceUrl}`;
            let response = await axios.get(url, this.config);

            return response.data;
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
            let responsePayload = response.data;
            return responsePayload;
        } catch (error) {
            this.handleApiError(error, resourceUrl);
        }
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
