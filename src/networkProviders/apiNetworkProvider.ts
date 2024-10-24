import { ErrContractQuery, ErrNetworkProvider } from "../errors";
import { IAddress } from "../interface";
import { getAxios } from "../utils";
import { numberToPaddedHex } from "../utils.codec";
import { AccountOnNetwork, GuardianData } from "./accounts";
import { defaultAxiosConfig, defaultPagination } from "./config";
import { BaseUserAgent } from "./constants";
import { ContractQueryRequest } from "./contractQueryRequest";
import { ContractQueryResponse } from "./contractQueryResponse";
import { IContractQuery, INetworkProvider, IPagination, ITransaction, ITransactionNext } from "./interface";
import { NetworkConfig } from "./networkConfig";
import { NetworkGeneralStatistics } from "./networkGeneralStatistics";
import { NetworkProviderConfig } from "./networkProviderConfig";
import { NetworkStake } from "./networkStake";
import { NetworkStatus } from "./networkStatus";
import { PairOnNetwork } from "./pairs";
import { ProxyNetworkProvider } from "./proxyNetworkProvider";
import { DefinitionOfFungibleTokenOnNetwork, DefinitionOfTokenCollectionOnNetwork } from "./tokenDefinitions";
import { FungibleTokenOfAccountOnNetwork, NonFungibleTokenOfAccountOnNetwork } from "./tokens";
import { TransactionOnNetwork, prepareTransactionForBroadcasting } from "./transactions";
import { TransactionStatus } from "./transactionStatus";
import { extendUserAgent } from "./userAgent";

// TODO: Find & remove duplicate code between "ProxyNetworkProvider" and "ApiNetworkProvider".
export class ApiNetworkProvider implements INetworkProvider {
    private url: string;
    private config: NetworkProviderConfig;
    private backingProxyNetworkProvider;
    private userAgentPrefix = `${BaseUserAgent}/api`;
    private axios: any;

    constructor(url: string, config?: NetworkProviderConfig) {
        this.url = url;
        const proxyConfig = this.getProxyConfig(config);
        this.config = { ...defaultAxiosConfig, ...config };
        this.backingProxyNetworkProvider = new ProxyNetworkProvider(url, proxyConfig);
        this.axios = getAxios();
        extendUserAgent(this.userAgentPrefix, this.config);
    }

    private getProxyConfig(config: NetworkProviderConfig | undefined) {
        let proxyConfig = JSON.parse(JSON.stringify(config || {}));
        proxyConfig = { ...defaultAxiosConfig, ...proxyConfig };
        return proxyConfig;
    }

    async getNetworkConfig(): Promise<NetworkConfig> {
        return await this.backingProxyNetworkProvider.getNetworkConfig();
    }

    async getNetworkStatus(): Promise<NetworkStatus> {
        return await this.backingProxyNetworkProvider.getNetworkStatus();
    }

    async getNetworkStakeStatistics(): Promise<NetworkStake> {
        const response = await this.doGetGeneric("stake");
        const networkStake = NetworkStake.fromHttpResponse(response);
        return networkStake;
    }

    async getNetworkGeneralStatistics(): Promise<NetworkGeneralStatistics> {
        const response = await this.doGetGeneric("stats");
        const stats = NetworkGeneralStatistics.fromHttpResponse(response);
        return stats;
    }

    async getAccount(address: IAddress): Promise<AccountOnNetwork> {
        const response = await this.doGetGeneric(`accounts/${address.bech32()}`);
        const account = AccountOnNetwork.fromHttpResponse(response);
        return account;
    }

    async getGuardianData(address: IAddress): Promise<GuardianData> {
        return await this.backingProxyNetworkProvider.getGuardianData(address);
    }

    async getFungibleTokensOfAccount(
        address: IAddress,
        pagination?: IPagination,
    ): Promise<FungibleTokenOfAccountOnNetwork[]> {
        pagination = pagination || defaultPagination;

        const url = `accounts/${address.bech32()}/tokens?${this.buildPaginationParams(pagination)}`;
        const response: any[] = await this.doGetGeneric(url);
        const tokens = response.map((item) => FungibleTokenOfAccountOnNetwork.fromHttpResponse(item));

        // TODO: Fix sorting
        tokens.sort((a, b) => a.identifier.localeCompare(b.identifier));
        return tokens;
    }

    async getNonFungibleTokensOfAccount(
        address: IAddress,
        pagination?: IPagination,
    ): Promise<NonFungibleTokenOfAccountOnNetwork[]> {
        pagination = pagination || defaultPagination;

        const url = `accounts/${address.bech32()}/nfts?${this.buildPaginationParams(pagination)}`;
        const response: any[] = await this.doGetGeneric(url);
        const tokens = response.map((item) => NonFungibleTokenOfAccountOnNetwork.fromApiHttpResponse(item));

        // TODO: Fix sorting
        tokens.sort((a, b) => a.identifier.localeCompare(b.identifier));
        return tokens;
    }

    async getFungibleTokenOfAccount(
        address: IAddress,
        tokenIdentifier: string,
    ): Promise<FungibleTokenOfAccountOnNetwork> {
        const response = await this.doGetGeneric(`accounts/${address.bech32()}/tokens/${tokenIdentifier}`);
        const tokenData = FungibleTokenOfAccountOnNetwork.fromHttpResponse(response);
        return tokenData;
    }

    async getNonFungibleTokenOfAccount(
        address: IAddress,
        collection: string,
        nonce: number,
    ): Promise<NonFungibleTokenOfAccountOnNetwork> {
        const nonceAsHex = numberToPaddedHex(nonce);
        const response = await this.doGetGeneric(`accounts/${address.bech32()}/nfts/${collection}-${nonceAsHex}`);
        const tokenData = NonFungibleTokenOfAccountOnNetwork.fromApiHttpResponse(response);
        return tokenData;
    }

    async getMexPairs(pagination?: IPagination): Promise<PairOnNetwork[]> {
        let url = `mex/pairs`;
        if (pagination) {
            url = `${url}?from=${pagination.from}&size=${pagination.size}`;
        }

        const response: any[] = await this.doGetGeneric(url);

        return response.map((item) => PairOnNetwork.fromApiHttpResponse(item));
    }

    async getTransaction(txHash: string): Promise<TransactionOnNetwork> {
        const response = await this.doGetGeneric(`transactions/${txHash}`);
        const transaction = TransactionOnNetwork.fromApiHttpResponse(txHash, response);
        return transaction;
    }

    async getTransactionStatus(txHash: string): Promise<TransactionStatus> {
        const response = await this.doGetGeneric(`transactions/${txHash}?fields=status`);
        const status = new TransactionStatus(response.status);
        return status;
    }

    async sendTransaction(tx: ITransaction | ITransactionNext): Promise<string> {
        const transaction = prepareTransactionForBroadcasting(tx);
        const response = await this.doPostGeneric("transactions", transaction);
        return response.txHash;
    }

    async sendTransactions(txs: (ITransaction | ITransactionNext)[]): Promise<string[]> {
        return await this.backingProxyNetworkProvider.sendTransactions(txs);
    }

    async simulateTransaction(tx: ITransaction | ITransactionNext): Promise<any> {
        return await this.backingProxyNetworkProvider.simulateTransaction(tx);
    }

    async queryContract(query: IContractQuery): Promise<ContractQueryResponse> {
        try {
            const request = new ContractQueryRequest(query).toHttpRequest();
            const response = await this.doPostGeneric("query", request);
            return ContractQueryResponse.fromHttpResponse(response);
        } catch (error: any) {
            throw new ErrContractQuery(error);
        }
    }

    async getDefinitionOfFungibleToken(tokenIdentifier: string): Promise<DefinitionOfFungibleTokenOnNetwork> {
        const response = await this.doGetGeneric(`tokens/${tokenIdentifier}`);
        const definition = DefinitionOfFungibleTokenOnNetwork.fromApiHttpResponse(response);
        return definition;
    }

    async getDefinitionOfTokenCollection(collection: string): Promise<DefinitionOfTokenCollectionOnNetwork> {
        const response = await this.doGetGeneric(`collections/${collection}`);
        const definition = DefinitionOfTokenCollectionOnNetwork.fromApiHttpResponse(response);
        return definition;
    }

    async getNonFungibleToken(collection: string, nonce: number): Promise<NonFungibleTokenOfAccountOnNetwork> {
        const nonceAsHex = numberToPaddedHex(nonce);
        const response = await this.doGetGeneric(`nfts/${collection}-${nonceAsHex}`);
        const token = NonFungibleTokenOfAccountOnNetwork.fromApiHttpResponse(response);
        return token;
    }

    async doGetGeneric(resourceUrl: string): Promise<any> {
        const response = await this.doGet(resourceUrl);
        return response;
    }

    async doPostGeneric(resourceUrl: string, payload: any): Promise<any> {
        const response = await this.doPost(resourceUrl, payload);
        return response;
    }

    private buildPaginationParams(pagination: IPagination) {
        return `from=${pagination.from}&size=${pagination.size}`;
    }

    private async doGet(resourceUrl: string): Promise<any> {
        const url = `${this.url}/${resourceUrl}`;

        try {
            const response = await this.axios.default.get(url, this.config);
            return response.data;
        } catch (error) {
            this.handleApiError(error, resourceUrl);
        }
    }

    private async doPost(resourceUrl: string, payload: any): Promise<any> {
        const url = `${this.url}/${resourceUrl}`;

        try {
            const response = await this.axios.default.post(url, payload, {
                ...this.config,
                headers: {
                    "Content-Type": "application/json",
                    ...this.config.headers,
                },
            });
            const responsePayload = response.data;
            return responsePayload;
        } catch (error) {
            this.handleApiError(error, resourceUrl);
        }
    }

    private handleApiError(error: any, resourceUrl: string) {
        if (!error.response) {
            throw new ErrNetworkProvider(resourceUrl, error.toString(), error);
        }

        const errorData = error.response.data;
        const originalErrorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
        throw new ErrNetworkProvider(resourceUrl, originalErrorMessage, error);
    }
}
