import {
    Address,
    ErrContractQuery,
    ErrNetworkProvider,
    getAxios,
    prepareTransactionForBroadcasting,
    SmartContractQuery,
    SmartContractQueryResponse,
    Token,
    TokenComputer,
    Transaction,
    TransactionOnNetwork,
    TransactionStatus,
    TransactionWatcher,
} from "../core";
import { METACHAIN_ID } from "../core/constants";
import { AccountAwaiter } from "./accountAwaiter";
import { AccountOnNetwork, AccountStorage, AccountStorageEntry } from "./accounts";
import { BlockOnNetwork } from "./blocks";
import { defaultAxiosConfig, defaultPagination } from "./config";
import { BaseUserAgent } from "./constants";
import { ContractQueryRequest } from "./contractQueryRequest";
import { INetworkProvider, IPagination } from "./interface";
import { NetworkConfig } from "./networkConfig";
import { NetworkProviderConfig } from "./networkProviderConfig";
import { NetworkStatus } from "./networkStatus";
import { ProxyNetworkProvider } from "./proxyNetworkProvider";
import { AwaitingOptions, TransactionCostResponse } from "./resources";
import { DefinitionOfFungibleTokenOnNetwork, DefinitionOfTokenCollectionOnNetwork } from "./tokenDefinitions";
import { TokenAmountOnNetwork } from "./tokens";
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

    async getBlock(blockHash: string): Promise<BlockOnNetwork> {
        const response = await this.doGetGeneric(`blocks/${blockHash}`);
        return BlockOnNetwork.fromHttpResponse(response);
    }

    async getLatestBlock(): Promise<BlockOnNetwork> {
        const response = await this.doGetGeneric("blocks/latest");
        return BlockOnNetwork.fromHttpResponse(response);
    }

    async getAccount(address: Address): Promise<AccountOnNetwork> {
        const response = await this.doGetGeneric(`accounts/${address.toBech32()}`);
        const account = AccountOnNetwork.fromApiHttpResponse(response);
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

    async awaitAccountOnCondition(
        address: Address,
        condition: (account: AccountOnNetwork) => boolean,
        options?: AwaitingOptions,
    ): Promise<AccountOnNetwork> {
        if (!options) {
            options = new AwaitingOptions();
        }
        const awaiter = new AccountAwaiter({
            fetcher: this,
            patienceTimeInMilliseconds: options.patienceInMilliseconds,
            pollingIntervalInMilliseconds: options.pollingIntervalInMilliseconds,
            timeoutIntervalInMilliseconds: options.timeoutInMilliseconds,
        });
        return await awaiter.awaitOnCondition(address, condition);
    }

    async sendTransaction(tx: Transaction): Promise<string> {
        const transaction = prepareTransactionForBroadcasting(tx);
        const response = await this.doPostGeneric("transactions", transaction);
        return response.txHash;
    }

    async simulateTransaction(tx: Transaction, checkSignature: boolean = false): Promise<any> {
        const transaction = prepareTransactionForBroadcasting(tx);
        let url = "transaction/simulate?checkSignature=false";
        if (checkSignature) {
            url = "transaction/simulate";
        }
        const response = await this.doPostGeneric(url, transaction);
        const data = response["data"] ?? {};
        return TransactionOnNetwork.fromSimulateResponse(transaction, data["result"] ?? {});
    }

    async estimateTransactionCost(tx: Transaction): Promise<TransactionCostResponse> {
        const copiedTx = Transaction.newFromPlainObject(tx.toPlainObject());
        if (!copiedTx.nonce) {
            copiedTx.nonce = (await this.getAccount(copiedTx.sender)).nonce;
        }

        if (!copiedTx.signature.length) {
            copiedTx.signature = new Uint8Array(64);
        }

        if (!copiedTx.guardian.isEmpty() && !copiedTx.guardianSignature.length) {
            copiedTx.guardianSignature = new Uint8Array(64);
        }

        if (!copiedTx.relayer.isEmpty() && !copiedTx.relayerSignature.length) {
            copiedTx.relayerSignature = new Uint8Array(64);
        }

        const transaction = prepareTransactionForBroadcasting(tx);
        const response = await this.doPostGeneric("transaction/cost", transaction);
        return TransactionCostResponse.fromHttpResponse(response.data);
    }

    async sendTransactions(txs: Transaction[]): Promise<[number, string[]]> {
        const data = txs.map((tx) => prepareTransactionForBroadcasting(tx));

        const response = await this.doPostGeneric("transaction/send-multiple", data);
        const numSent = Number(response.data["numOfSentTxs"] ?? 0);
        const hashes = Array(txs.length).fill(null);

        for (let i = 0; i < txs.length; i++) {
            hashes[i] = response.data.txsHashes[i.toString()] || null;
        }
        return [numSent, hashes];
    }

    async getTransaction(txHash: string): Promise<TransactionOnNetwork> {
        const response = await this.doGetGeneric(`transactions/${txHash}`);
        const transaction = TransactionOnNetwork.fromApiHttpResponse(txHash, response);
        return transaction;
    }

    async getTransactions(address: Address): Promise<TransactionOnNetwork[]> {
        const response = await this.doGetGeneric(`accounts/${address.toBech32()}/transactions`);
        const transactions = response.map((item: any) => TransactionOnNetwork.fromApiHttpResponse(item.txHash, item));
        return transactions;
    }

    async getTransactionStatus(txHash: string): Promise<TransactionStatus> {
        const response = await this.doGetGeneric(`transactions/${txHash}?fields=status`);
        const status = new TransactionStatus(response.status);
        return status;
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

    async getTokenOfAccount(address: Address, token: Token): Promise<TokenAmountOnNetwork> {
        let response;
        if (token.nonce === 0n) {
            response = await this.doGetGeneric(`accounts/${address.toBech32()}/tokens/${token.identifier}`);
        } else {
            const identifier = new TokenComputer().computeExtendedIdentifier(token);
            response = await this.doGetGeneric(`accounts/${address.toBech32()}/nfts/${identifier}`);
        }
        return TokenAmountOnNetwork.fromApiResponse(response);
    }

    async getFungibleTokensOfAccount(address: Address, pagination?: IPagination): Promise<TokenAmountOnNetwork[]> {
        pagination = pagination || defaultPagination;

        const url = `accounts/${address.toBech32()}/tokens?${this.buildPaginationParams(pagination)}`;
        const response: any[] = await this.doGetGeneric(url);
        const tokens = response.map((item) => TokenAmountOnNetwork.fromApiResponse(item));
        return tokens;
    }

    async getNonFungibleTokensOfAccount(address: Address, pagination?: IPagination): Promise<TokenAmountOnNetwork[]> {
        pagination = pagination || defaultPagination;

        const url = `accounts/${address.toBech32()}/nfts?${this.buildPaginationParams(pagination)}`;
        const response: any[] = await this.doGetGeneric(url);
        const tokens = response.map((item) => TokenAmountOnNetwork.fromApiResponse(item));
        return tokens;
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
