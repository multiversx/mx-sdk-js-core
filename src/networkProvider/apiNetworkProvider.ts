import axios, { AxiosRequestConfig } from "axios";
import { AccountOnNetwork } from "./accounts";
import { IAddress, IContractQuery, IDefinitionOfFungibleTokenOnNetwork, IDefinitionOfTokenCollectionOnNetwork, IFungibleTokenOfAccountOnNetwork, IHash, INetworkProvider, INonce, INonFungibleTokenOfAccountOnNetwork, ITransaction, Pagination } from "./interface";
import { NetworkConfig } from "./networkConfig";
import { NetworkStake } from "./networkStake";
import { Stats } from "./stats";
import { ProxyNetworkProvider } from "./proxyNetworkProvider";
import { DefinitionOfFungibleTokenOnNetwork, DefinitionOfTokenCollectionOnNetwork } from "./tokenDefinitions";
import { FungibleTokenOfAccountOnNetwork, NonFungibleTokenOfAccountOnNetwork } from "./tokens";
import { TransactionOnNetwork } from "./transactions";
import { TransactionStatus } from "./transactionStatus";
import { Hash } from "./primitives";
import { ErrNetworkProvider } from "./errors";
import { defaultAxiosConfig } from "./config";
import { NetworkStatus } from "./networkStatus";
import { ContractQueryResponse } from "./contractQueryResponse";

// TODO: Find & remove duplicate code between "ProxyNetworkProvider" and "ApiNetworkProvider".
export class ApiNetworkProvider implements INetworkProvider {
    private url: string;
    private config: AxiosRequestConfig;
    private backingProxyNetworkProvider;

    constructor(url: string, config?: AxiosRequestConfig) {
        this.url = url;
        this.config = { ...defaultAxiosConfig, ...config };
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

    async getAccount(address: IAddress): Promise<AccountOnNetwork> {
        let response = await this.doGetGeneric(`accounts/${address.bech32()}`);
        let account = AccountOnNetwork.fromHttpResponse(response);
        return account;
    }

    async getFungibleTokensOfAccount(address: IAddress, pagination?: Pagination): Promise<IFungibleTokenOfAccountOnNetwork[]> {
        pagination = pagination || Pagination.default();

        let url = `accounts/${address.bech32()}/tokens?${this.buildPaginationParams(pagination)}`;
        let response: any[] = await this.doGetGeneric(url);
        let tokens = response.map(item => FungibleTokenOfAccountOnNetwork.fromHttpResponse(item));

        // TODO: Fix sorting
        tokens.sort((a, b) => a.identifier.localeCompare(b.identifier));
        return tokens;
    }

    async getNonFungibleTokensOfAccount(address: IAddress, pagination?: Pagination): Promise<INonFungibleTokenOfAccountOnNetwork[]> {
        pagination = pagination || Pagination.default();

        let url = `accounts/${address.bech32()}/nfts?${this.buildPaginationParams(pagination)}`;
        let response: any[] = await this.doGetGeneric(url);
        let tokens = response.map(item => NonFungibleTokenOfAccountOnNetwork.fromApiHttpResponse(item));
        
        // TODO: Fix sorting
        tokens.sort((a, b) => a.identifier.localeCompare(b.identifier));
        return tokens;
    }

    async getFungibleTokenOfAccount(address: IAddress, tokenIdentifier: string): Promise<IFungibleTokenOfAccountOnNetwork> {
        let response = await this.doGetGeneric(`accounts/${address.bech32()}/tokens/${tokenIdentifier}`);
        let tokenData = FungibleTokenOfAccountOnNetwork.fromHttpResponse(response);
        return tokenData;
    }

    async getNonFungibleTokenOfAccount(address: IAddress, collection: string, nonce: INonce): Promise<INonFungibleTokenOfAccountOnNetwork> {
        let response = await this.doGetGeneric(`accounts/${address.bech32()}/nfts/${collection}-${nonce.hex()}`);
        let tokenData = NonFungibleTokenOfAccountOnNetwork.fromApiHttpResponse(response);
        return tokenData;
    }

    async getTransaction(txHash: IHash): Promise<TransactionOnNetwork> {
        let response = await this.doGetGeneric(`transactions/${txHash.toString()}`);
        let transaction = TransactionOnNetwork.fromApiHttpResponse(txHash, response);
        return transaction;
    }

    async getTransactionStatus(txHash: IHash): Promise<TransactionStatus> {
        let response = await this.doGetGeneric(`transactions/${txHash.toString()}?fields=status`);
        let status = new TransactionStatus(response.status);
        return status;
    }

    async sendTransaction(tx: ITransaction): Promise<IHash> {
        let response = await this.doPostGeneric("transactions", tx.toSendable());
        let hash = new Hash(response.txHash);
        return hash;
    }

    async simulateTransaction(tx: ITransaction): Promise<any> {
        return await this.backingProxyNetworkProvider.simulateTransaction(tx);
    }

    async queryContract(query: IContractQuery): Promise<ContractQueryResponse> {
        let data = query.toHttpRequest();
        let response = await this.doPostGeneric("query", data);
        let queryResponse = ContractQueryResponse.fromHttpResponse(response);
        return queryResponse;
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

    async getNonFungibleToken(collection: string, nonce: INonce): Promise<INonFungibleTokenOfAccountOnNetwork> {
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
            console.warn(error);
            throw new ErrNetworkProvider(resourceUrl, error.toString(), error);
        }

        let errorData = error.response.data;
        let originalErrorMessage = errorData.error || errorData.message || JSON.stringify(errorData);
        throw new ErrNetworkProvider(resourceUrl, originalErrorMessage, error);
    }
}
