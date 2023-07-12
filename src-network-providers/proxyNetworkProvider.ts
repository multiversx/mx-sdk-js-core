import axios, { AxiosRequestConfig } from "axios";
import { AccountOnNetwork, GuardianData } from "./accounts";
import { defaultAxiosConfig } from "./config";
import { EsdtContractAddress } from "./constants";
import { ContractQueryRequest } from "./contractQueryRequest";
import { ContractQueryResponse } from "./contractQueryResponse";
import { ErrContractQuery, ErrNetworkProvider } from "./errors";
import { IAddress, IContractQuery, INetworkProvider, IPagination, ITransaction } from "./interface";
import { NetworkConfig } from "./networkConfig";
import { NetworkGeneralStatistics } from "./networkGeneralStatistics";
import { NetworkStake } from "./networkStake";
import { NetworkStatus } from "./networkStatus";
import { DefinitionOfFungibleTokenOnNetwork, DefinitionOfTokenCollectionOnNetwork } from "./tokenDefinitions";
import { FungibleTokenOfAccountOnNetwork, NonFungibleTokenOfAccountOnNetwork } from "./tokens";
import { TransactionOnNetwork } from "./transactions";
import { TransactionStatus } from "./transactionStatus";

// TODO: Find & remove duplicate code between "ProxyNetworkProvider" and "ApiNetworkProvider".
export class ProxyNetworkProvider implements INetworkProvider {
    private url: string;
    private config: AxiosRequestConfig;

    constructor(url: string, config?: AxiosRequestConfig) {
        this.url = url;
        this.config = { ...defaultAxiosConfig, ...config };
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
        // https://github.com/multiversx/mx-api-service/blob/main/src/endpoints/stake/stake.service.ts
        throw new Error("Method not implemented.");
    }

    async getNetworkGeneralStatistics(): Promise<NetworkGeneralStatistics> {
        // TODO: Implement wrt. (full implementation may not be possible):
        // https://github.com/multiversx/mx-api-service/blob/main/src/endpoints/network/network.service.ts
        throw new Error("Method not implemented.");
    }

    async getAccount(address: IAddress): Promise<AccountOnNetwork> {
        let response = await this.doGetGeneric(`address/${address.bech32()}`);
        let account = AccountOnNetwork.fromHttpResponse(response.account);
        return account;
    }

    async getGuardianData(address: IAddress): Promise<GuardianData> {
        const response = await this.doGetGeneric(`address/${address.bech32()}/guardian-data`);
        const accountGuardian = GuardianData.fromHttpResponse(response.guardianData);
        return accountGuardian;
    }

    async getFungibleTokensOfAccount(address: IAddress, _pagination?: IPagination): Promise<FungibleTokenOfAccountOnNetwork[]> {
        let url = `address/${address.bech32()}/esdt`;
        let response = await this.doGetGeneric(url);
        let responseItems: any[] = Object.values(response.esdts);
        // Skip NFTs / SFTs.
        let responseItemsFiltered = responseItems.filter(item => !item.nonce);
        let tokens = responseItemsFiltered.map(item => FungibleTokenOfAccountOnNetwork.fromHttpResponse(item));

        // TODO: Fix sorting
        tokens.sort((a, b) => a.identifier.localeCompare(b.identifier));
        return tokens;
    }

    async getNonFungibleTokensOfAccount(address: IAddress, _pagination?: IPagination): Promise<NonFungibleTokenOfAccountOnNetwork[]> {
        let url = `address/${address.bech32()}/esdt`;
        let response = await this.doGetGeneric(url);
        let responseItems: any[] = Object.values(response.esdts);
        // Skip fungible tokens.
        let responseItemsFiltered = responseItems.filter(item => item.nonce >= 0);
        let tokens = responseItemsFiltered.map(item => NonFungibleTokenOfAccountOnNetwork.fromProxyHttpResponse(item));

        // TODO: Fix sorting
        tokens.sort((a, b) => a.identifier.localeCompare(b.identifier));
        return tokens;
    }

    async getFungibleTokenOfAccount(address: IAddress, tokenIdentifier: string): Promise<FungibleTokenOfAccountOnNetwork> {
        let response = await this.doGetGeneric(`address/${address.bech32()}/esdt/${tokenIdentifier}`);
        let tokenData = FungibleTokenOfAccountOnNetwork.fromHttpResponse(response.tokenData);
        return tokenData;
    }

    async getNonFungibleTokenOfAccount(address: IAddress, collection: string, nonce: number): Promise<NonFungibleTokenOfAccountOnNetwork> {
        let response = await this.doGetGeneric(`address/${address.bech32()}/nft/${collection}/nonce/${nonce.valueOf()}`);
        let tokenData = NonFungibleTokenOfAccountOnNetwork.fromProxyHttpResponseByNonce(response.tokenData);
        return tokenData;
    }

    async getTransaction(txHash: string, withProcessStatus?: boolean): Promise<TransactionOnNetwork> {
        let processStatusPromise: Promise<TransactionStatus> | undefined;

        if (withProcessStatus === true) {
            processStatusPromise = this.getTransactionStatus(txHash);
        }

        let url = this.buildUrlWithQueryParameters(`transaction/${txHash}`, { withResults: "true" });
        let response = await this.doGetGeneric(url);

        if (processStatusPromise) {
            const processStatus = await processStatusPromise;
            return TransactionOnNetwork.fromProxyHttpResponse(txHash, response.transaction, processStatus);
        }
        return TransactionOnNetwork.fromProxyHttpResponse(txHash, response.transaction);
    }

    async getTransactionStatus(txHash: string): Promise<TransactionStatus> {
        let response = await this.doGetGeneric(`transaction/${txHash}/process-status`);
        let status = new TransactionStatus(response.status);
        return status;
    }

    async sendTransaction(tx: ITransaction): Promise<string> {
        let response = await this.doPostGeneric("transaction/send", tx.toSendable());
        return response.txHash;
    }

    async sendTransactions(txs: ITransaction[]): Promise<string[]> {
        const data: any = txs.map(tx => tx.toSendable());
        const response = await this.doPostGeneric("transaction/send-multiple", data);
        const hashes = Array(txs.length).fill(null);

        for (let i = 0; i < txs.length; i++) {
            hashes[i] = response.txsHashes[i.toString()] || null;
        }

        return hashes;
    }

    async simulateTransaction(tx: ITransaction): Promise<any> {
        let response = await this.doPostGeneric("transaction/simulate", tx.toSendable());
        return response;
    }

    async queryContract(query: IContractQuery): Promise<ContractQueryResponse> {
        try {
            let request = new ContractQueryRequest(query).toHttpRequest();
            let response = await this.doPostGeneric("vm-values/query", request);
            return ContractQueryResponse.fromHttpResponse(response.data);
        } catch (error: any) {
            throw new ErrContractQuery(error);
        }
    }

    async getDefinitionOfFungibleToken(tokenIdentifier: string): Promise<DefinitionOfFungibleTokenOnNetwork> {
        let properties = await this.getTokenProperties(tokenIdentifier);
        let definition = DefinitionOfFungibleTokenOnNetwork.fromResponseOfGetTokenProperties(tokenIdentifier, properties);
        return definition;
    }

    private async getTokenProperties(identifier: string): Promise<Buffer[]> {
        let encodedIdentifier = Buffer.from(identifier).toString("hex");

        let queryResponse = await this.queryContract({
            address: EsdtContractAddress,
            func: "getTokenProperties",
            getEncodedArguments: () => [encodedIdentifier]
        });

        let properties = queryResponse.getReturnDataParts();
        return properties;
    }

    async getDefinitionOfTokenCollection(collection: string): Promise<DefinitionOfTokenCollectionOnNetwork> {
        let properties = await this.getTokenProperties(collection);
        let definition = DefinitionOfTokenCollectionOnNetwork.fromResponseOfGetTokenProperties(collection, properties);
        return definition;
    }

    async getNonFungibleToken(_collection: string, _nonce: number): Promise<NonFungibleTokenOfAccountOnNetwork> {
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
        let url = `${this.url}/${resourceUrl}`;

        try {
            let response = await axios.get(url, this.config);
            let payload = response.data.data;
            return payload;
        } catch (error) {
            this.handleApiError(error, resourceUrl);
        }
    }

    private async doPost(resourceUrl: string, payload: any): Promise<any> {
        let url = `${this.url}/${resourceUrl}`;

        try {
            let response = await axios.post(url, payload, {
                ...this.config,
                headers: {
                    "Content-Type": "application/json",
                    ...this.config.headers,
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
            throw new ErrNetworkProvider(resourceUrl, error.toString(), error);
        }

        const errorData = error.response.data;
        const originalErrorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
        throw new ErrNetworkProvider(resourceUrl, originalErrorMessage, error);
    }
}
