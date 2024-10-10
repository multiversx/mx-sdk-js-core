import axios from "axios";
import { ErrContractQuery, ErrNetworkProvider } from "../errors";
import { AccountOnNetwork, GuardianData } from "./accounts";
import { defaultAxiosConfig } from "./config";
import { BaseUserAgent, EsdtContractAddress } from "./constants";
import { ContractQueryRequest } from "./contractQueryRequest";
import { ContractQueryResponse } from "./contractQueryResponse";
import { IAddress, IContractQuery, INetworkProvider, IPagination, ITransaction, ITransactionNext } from "./interface";
import { NetworkConfig } from "./networkConfig";
import { NetworkGeneralStatistics } from "./networkGeneralStatistics";
import { NetworkProviderConfig } from "./networkProviderConfig";
import { NetworkStake } from "./networkStake";
import { NetworkStatus } from "./networkStatus";
import { DefinitionOfFungibleTokenOnNetwork, DefinitionOfTokenCollectionOnNetwork } from "./tokenDefinitions";
import { FungibleTokenOfAccountOnNetwork, NonFungibleTokenOfAccountOnNetwork } from "./tokens";
import { TransactionOnNetwork, prepareTransactionForBroadcasting } from "./transactions";
import { TransactionStatus } from "./transactionStatus";
import { extendUserAgent } from "./userAgent";

// TODO: Find & remove duplicate code between "ProxyNetworkProvider" and "ApiNetworkProvider".
export class ProxyNetworkProvider implements INetworkProvider {
    private url: string;
    private config: NetworkProviderConfig;
    private userAgentPrefix = `${BaseUserAgent}/proxy`;

    constructor(url: string, config?: NetworkProviderConfig) {
        this.url = url;
        this.config = { ...defaultAxiosConfig, ...config };
        extendUserAgent(this.userAgentPrefix, this.config);
    }

    async getNetworkConfig(): Promise<NetworkConfig> {
        const response = await this.doGetGeneric("network/config");
        const networkConfig = NetworkConfig.fromHttpResponse(response.config);
        return networkConfig;
    }

    async getNetworkStatus(): Promise<NetworkStatus> {
        const response = await this.doGetGeneric("network/status/4294967295");
        const networkStatus = NetworkStatus.fromHttpResponse(response.status);
        return networkStatus;
    }

    async getNetworkStakeStatistics(): Promise<NetworkStake> {
        // TODO: Implement wrt.:
        // https://github.com/multiversx/mx-api-service/blob/main/src/endpoints/stake/stake.service.ts
        throw new Error("Method not implemented.");
    }

    async getNetworkGeneralStatistics(): Promise<NetworkGeneralStatistics> {
        // TODO: Implement wrt. (full implementation may not be possible):
        // https://github.com/multiversx/mx-api-service/blob/main/src/endpoints/network/network.service.ts
        throw new Error("Method not implemented.");
    }

    async getAccount(address: IAddress): Promise<AccountOnNetwork> {
        const response = await this.doGetGeneric(`address/${address.bech32()}`);
        const account = AccountOnNetwork.fromHttpResponse(response.account);
        return account;
    }

    async getGuardianData(address: IAddress): Promise<GuardianData> {
        const response = await this.doGetGeneric(`address/${address.bech32()}/guardian-data`);
        const accountGuardian = GuardianData.fromHttpResponse(response.guardianData);
        return accountGuardian;
    }

    async getFungibleTokensOfAccount(
        address: IAddress,
        _pagination?: IPagination,
    ): Promise<FungibleTokenOfAccountOnNetwork[]> {
        const url = `address/${address.bech32()}/esdt`;
        const response = await this.doGetGeneric(url);
        const responseItems: any[] = Object.values(response.esdts);
        // Skip NFTs / SFTs.
        const responseItemsFiltered = responseItems.filter((item) => !item.nonce);
        const tokens = responseItemsFiltered.map((item) => FungibleTokenOfAccountOnNetwork.fromHttpResponse(item));

        // TODO: Fix sorting
        tokens.sort((a, b) => a.identifier.localeCompare(b.identifier));
        return tokens;
    }

    async getNonFungibleTokensOfAccount(
        address: IAddress,
        _pagination?: IPagination,
    ): Promise<NonFungibleTokenOfAccountOnNetwork[]> {
        const url = `address/${address.bech32()}/esdt`;
        const response = await this.doGetGeneric(url);
        const responseItems: any[] = Object.values(response.esdts);
        // Skip fungible tokens.
        const responseItemsFiltered = responseItems.filter((item) => item.nonce >= 0);
        const tokens = responseItemsFiltered.map((item) =>
            NonFungibleTokenOfAccountOnNetwork.fromProxyHttpResponse(item),
        );

        // TODO: Fix sorting
        tokens.sort((a, b) => a.identifier.localeCompare(b.identifier));
        return tokens;
    }

    async getFungibleTokenOfAccount(
        address: IAddress,
        tokenIdentifier: string,
    ): Promise<FungibleTokenOfAccountOnNetwork> {
        const response = await this.doGetGeneric(`address/${address.bech32()}/esdt/${tokenIdentifier}`);
        const tokenData = FungibleTokenOfAccountOnNetwork.fromHttpResponse(response.tokenData);
        return tokenData;
    }

    async getNonFungibleTokenOfAccount(
        address: IAddress,
        collection: string,
        nonce: number,
    ): Promise<NonFungibleTokenOfAccountOnNetwork> {
        const response = await this.doGetGeneric(
            `address/${address.bech32()}/nft/${collection}/nonce/${nonce.valueOf()}`,
        );
        const tokenData = NonFungibleTokenOfAccountOnNetwork.fromProxyHttpResponseByNonce(response.tokenData);
        return tokenData;
    }

    async getTransaction(txHash: string, withProcessStatus?: boolean): Promise<TransactionOnNetwork> {
        let processStatusPromise: Promise<TransactionStatus> | undefined;

        if (withProcessStatus === true) {
            processStatusPromise = this.getTransactionStatus(txHash);
        }

        const url = this.buildUrlWithQueryParameters(`transaction/${txHash}`, { withResults: "true" });
        const response = await this.doGetGeneric(url);

        if (processStatusPromise) {
            const processStatus = await processStatusPromise;
            return TransactionOnNetwork.fromProxyHttpResponse(txHash, response.transaction, processStatus);
        }
        return TransactionOnNetwork.fromProxyHttpResponse(txHash, response.transaction);
    }

    async getTransactionStatus(txHash: string): Promise<TransactionStatus> {
        const response = await this.doGetGeneric(`transaction/${txHash}/process-status`);
        const status = new TransactionStatus(response.status);
        return status;
    }

    async sendTransaction(tx: ITransaction | ITransactionNext): Promise<string> {
        const transaction = prepareTransactionForBroadcasting(tx);
        const response = await this.doPostGeneric("transaction/send", transaction);
        return response.txHash;
    }

    async sendTransactions(txs: (ITransaction | ITransactionNext)[]): Promise<string[]> {
        const data = txs.map((tx) => prepareTransactionForBroadcasting(tx));

        const response = await this.doPostGeneric("transaction/send-multiple", data);
        const hashes = Array(txs.length).fill(null);

        for (let i = 0; i < txs.length; i++) {
            hashes[i] = response.txsHashes[i.toString()] || null;
        }

        return hashes;
    }

    async simulateTransaction(tx: ITransaction | ITransactionNext): Promise<any> {
        const transaction = prepareTransactionForBroadcasting(tx);
        const response = await this.doPostGeneric("transaction/simulate", transaction);
        return response;
    }

    async queryContract(query: IContractQuery): Promise<ContractQueryResponse> {
        try {
            const request = new ContractQueryRequest(query).toHttpRequest();
            const response = await this.doPostGeneric("vm-values/query", request);
            return ContractQueryResponse.fromHttpResponse(response.data);
        } catch (error: any) {
            throw new ErrContractQuery(error);
        }
    }

    async getDefinitionOfFungibleToken(tokenIdentifier: string): Promise<DefinitionOfFungibleTokenOnNetwork> {
        const properties = await this.getTokenProperties(tokenIdentifier);
        const definition = DefinitionOfFungibleTokenOnNetwork.fromResponseOfGetTokenProperties(
            tokenIdentifier,
            properties,
        );
        return definition;
    }

    private async getTokenProperties(identifier: string): Promise<Buffer[]> {
        const encodedIdentifier = Buffer.from(identifier).toString("hex");

        const queryResponse = await this.queryContract({
            address: EsdtContractAddress,
            func: "getTokenProperties",
            getEncodedArguments: () => [encodedIdentifier],
        });

        const properties = queryResponse.getReturnDataParts();
        return properties;
    }

    async getDefinitionOfTokenCollection(collection: string): Promise<DefinitionOfTokenCollectionOnNetwork> {
        const properties = await this.getTokenProperties(collection);
        const definition = DefinitionOfTokenCollectionOnNetwork.fromResponseOfGetTokenProperties(
            collection,
            properties,
        );
        return definition;
    }

    async getNonFungibleToken(_collection: string, _nonce: number): Promise<NonFungibleTokenOfAccountOnNetwork> {
        throw new Error("Method not implemented.");
    }

    async doGetGeneric(resourceUrl: string): Promise<any> {
        const response = await this.doGet(resourceUrl);
        return response;
    }

    async doPostGeneric(resourceUrl: string, payload: any): Promise<any> {
        const response = await this.doPost(resourceUrl, payload);
        return response;
    }

    private async doGet(resourceUrl: string): Promise<any> {
        const url = `${this.url}/${resourceUrl}`;

        try {
            const response = await axios.get(url, this.config);
            const payload = response.data.data;
            return payload;
        } catch (error) {
            this.handleApiError(error, resourceUrl);
        }
    }

    private async doPost(resourceUrl: string, payload: any): Promise<any> {
        const url = `${this.url}/${resourceUrl}`;

        try {
            const response = await axios.post(url, payload, {
                ...this.config,
                headers: {
                    "Content-Type": "application/json",
                    ...this.config.headers,
                },
            });
            const responsePayload = response.data.data;
            return responsePayload;
        } catch (error) {
            this.handleApiError(error, resourceUrl);
        }
    }

    private buildUrlWithQueryParameters(endpoint: string, params: Record<string, string>): string {
        const searchParams = new URLSearchParams();

        for (let [key, value] of Object.entries(params)) {
            if (value) {
                searchParams.append(key, value);
            }
        }

        return `${endpoint}?${searchParams.toString()}`;
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
