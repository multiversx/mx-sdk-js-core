import { Address } from "../address";
import { METACHAIN_ID } from "../constants";
import { ErrContractQuery, ErrNetworkProvider } from "../errors";
import { SmartContractQuery, SmartContractQueryResponse } from "../smartContractQuery";
import { Token } from "../tokens";
import { Transaction } from "../transaction";
import { prepareTransactionForBroadcasting, TransactionOnNetwork } from "../transactionOnNetwork";
import { TransactionWatcher } from "../transactionWatcher";
import { getAxios } from "../utils";
import { numberToPaddedHex } from "../utils.codec";
import { AccountOnNetwork, GuardianData } from "./accounts";
import { BlockOnNetwork } from "./blockOnNetwork";
import { defaultAxiosConfig, defaultPagination } from "./config";
import { BaseUserAgent } from "./constants";
import { ContractQueryRequest } from "./contractQueryRequest";
import { INetworkProvider, IPagination } from "./interface";
import { NetworkConfig } from "./networkConfig";
import { NetworkProviderConfig } from "./networkProviderConfig";
import { NetworkStatus } from "./networkStatus";
import { PairOnNetwork } from "./pairs";
import { ProxyNetworkProvider } from "./proxyNetworkProvider";
import {
    AccountStorage,
    AccountStorageEntry,
    AwaitingOptions,
    GetBlockArguments,
    TransactionCostEstimationResponse,
} from "./resources";
import { DefinitionOfFungibleTokenOnNetwork, DefinitionOfTokenCollectionOnNetwork } from "./tokenDefinitions";
import { FungibleTokenOfAccountOnNetwork, NonFungibleTokenOfAccountOnNetwork } from "./tokens";
import { extendUserAgentIfBackend } from "./userAgent";

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
        extendUserAgentIfBackend(this.userAgentPrefix, this.config);
    }

    private getProxyConfig(config: NetworkProviderConfig | undefined) {
        let proxyConfig = JSON.parse(JSON.stringify(config || {}));
        proxyConfig = { ...defaultAxiosConfig, ...proxyConfig };
        return proxyConfig;
    }

    async getNetworkConfig(): Promise<NetworkConfig> {
        return await this.backingProxyNetworkProvider.getNetworkConfig();
    }

    async getNetworkStatus(shard: number = METACHAIN_ID): Promise<NetworkStatus> {
        return await this.backingProxyNetworkProvider.getNetworkStatus(shard);
    }

    async getBlock(blockArgs: GetBlockArguments): Promise<BlockOnNetwork> {
        const response = await this.doGetGeneric(`blocks/${blockArgs.blockHash}`);
        return BlockOnNetwork.fromHttpResponse(response);
    }

    async getLatestBlock(_shard: number): Promise<BlockOnNetwork> {
        const response = await this.doGetGeneric("block/latest");
        return BlockOnNetwork.fromHttpResponse(response);
    }

    async getAccount(address: Address): Promise<AccountOnNetwork> {
        const response = await this.doGetGeneric(`accounts/${address.toBech32()}`);
        const account = AccountOnNetwork.fromHttpResponse(response);
        return account;
    }

    async getAccountStorage(address: Address): Promise<AccountStorage> {
        const response = await this.doGetGeneric(`address/${address.toBech32()}/keys`);
        const account = AccountStorage.fromHttpResponse(response.data);
        return account;
    }

    async getAccountStorageEntry(address: Address, entryKey: string): Promise<AccountStorageEntry> {
        const keyAsHex = Buffer.from(entryKey).toString("hex");
        const response = await this.doGetGeneric(`address/${address.toBech32()}/key/${keyAsHex}`);
        const account = AccountStorageEntry.fromHttpResponse(response.data, entryKey);
        return account;
    }

    awaitAccountOnCondition(
        _address: Address,
        _condition: (account: AccountOnNetwork) => boolean,
        options?: AwaitingOptions,
    ): AccountOnNetwork {
        if (!options) {
            options = new AwaitingOptions();
        }
        throw new Error("Method not implemented.");
    }

    async sendTransaction(tx: Transaction): Promise<string> {
        const transaction = prepareTransactionForBroadcasting(tx);
        const response = await this.doPostGeneric("transactions", transaction);
        return response.txHash;
    }

    async simulateTransaction(tx: Transaction): Promise<any> {
        return await this.backingProxyNetworkProvider.simulateTransaction(tx);
    }
    async estimateTransactionCost(tx: Transaction): Promise<TransactionCostEstimationResponse> {
        const transaction = prepareTransactionForBroadcasting(tx);
        const response = await this.doPostGeneric("transaction/cost", transaction);
        return TransactionCostEstimationResponse.fromHttpResponse(response);
    }

    async sendTransactions(txs: Transaction[]): Promise<string[]> {
        return await this.backingProxyNetworkProvider.sendTransactions(txs);
    }

    async getTransaction(txHash: string): Promise<TransactionOnNetwork> {
        const response = await this.doGetGeneric(`transactions/${txHash}`);
        const transaction = TransactionOnNetwork.fromApiHttpResponse(txHash, response);
        return transaction;
    }

    async awaitTransactionOnCondition(
        transactionHash: string,
        condition: (account: TransactionOnNetwork) => boolean,
        options?: AwaitingOptions,
    ): Promise<TransactionOnNetwork> {
        if (!options) {
            options = new AwaitingOptions();
        }

        const awaiter = new TransactionWatcher(this, {
            patienceMilliseconds: options.patienceInMilliseconds,
            pollingIntervalMilliseconds: options.pollingIntervalInMilliseconds,
            timeoutMilliseconds: options.timeoutInMilliseconds,
        });
        return await awaiter.awaitOnCondition(transactionHash, condition);
    }
    async awaitTransactionCompleted(transactionHash: string, options?: AwaitingOptions): Promise<TransactionOnNetwork> {
        if (!options) {
            options = new AwaitingOptions();
        }

        const awaiter = new TransactionWatcher(this, {
            patienceMilliseconds: options.patienceInMilliseconds,
            pollingIntervalMilliseconds: options.pollingIntervalInMilliseconds,
            timeoutMilliseconds: options.timeoutInMilliseconds,
        });
        return await awaiter.awaitCompleted(transactionHash);
    }

    //TODO check this
    async getTokenOfAccount(address: Address, token: Token): Promise<FungibleTokenOfAccountOnNetwork> {
        let response;
        if (token.nonce === 0n) {
            response = await this.doGetGeneric(`accounts/${address.toBech32()}/tokens/${token.identifier}`);
        } else {
            response = await this.doGetGeneric(
                `accounts/${address.toBech32()}/nfts/${token.identifier}/nonce/${token.nonce}`,
            );
        }
        return FungibleTokenOfAccountOnNetwork.fromHttpResponse(response);
    }

    async getGuardianData(address: Address): Promise<GuardianData> {
        return await this.backingProxyNetworkProvider.getGuardianData(address);
    }

    async getFungibleTokensOfAccount(
        address: Address,
        pagination?: IPagination,
    ): Promise<FungibleTokenOfAccountOnNetwork[]> {
        pagination = pagination || defaultPagination;

        const url = `accounts/${address.toBech32()}/tokens?${this.buildPaginationParams(pagination)}`;
        const response: any[] = await this.doGetGeneric(url);
        const tokens = response.map((item) => FungibleTokenOfAccountOnNetwork.fromHttpResponse(item));
        return tokens;
    }

    async getNonFungibleTokensOfAccount(
        address: Address,
        pagination?: IPagination,
    ): Promise<NonFungibleTokenOfAccountOnNetwork[]> {
        pagination = pagination || defaultPagination;

        const url = `accounts/${address.toBech32()}/nfts?${this.buildPaginationParams(pagination)}`;
        const response: any[] = await this.doGetGeneric(url);
        const tokens = response.map((item) => NonFungibleTokenOfAccountOnNetwork.fromApiHttpResponse(item));
        return tokens;
    }

    async getFungibleTokenOfAccount(
        address: Address,
        tokenIdentifier: string,
    ): Promise<FungibleTokenOfAccountOnNetwork> {
        const response = await this.doGetGeneric(`accounts/${address.toBech32()}/tokens/${tokenIdentifier}`);
        const tokenData = FungibleTokenOfAccountOnNetwork.fromHttpResponse(response);
        return tokenData;
    }

    async getNonFungibleTokenOfAccount(
        address: Address,
        collection: string,
        nonce: number,
    ): Promise<NonFungibleTokenOfAccountOnNetwork> {
        const nonceAsHex = numberToPaddedHex(nonce);
        const response = await this.doGetGeneric(`accounts/${address.toBech32()}/nfts/${collection}-${nonceAsHex}`);
        const tokenData = NonFungibleTokenOfAccountOnNetwork.fromApiHttpResponse(response);
        return tokenData;
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

    async getMexPairs(pagination?: IPagination): Promise<PairOnNetwork[]> {
        let url = `mex/pairs`;
        if (pagination) {
            url = `${url}?from=${pagination.from}&size=${pagination.size}`;
        }

        const response: any[] = await this.doGetGeneric(url);

        return response.map((item) => PairOnNetwork.fromApiHttpResponse(item));
    }

    async queryContract(query: SmartContractQuery): Promise<SmartContractQueryResponse> {
        try {
            const request = new ContractQueryRequest(query).toHttpRequest();
            const response = await this.doPostGeneric("query", request);
            return SmartContractQueryResponse.fromHttpResponse(response, query.function);
        } catch (error: any) {
            throw new ErrContractQuery(error);
        }
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
