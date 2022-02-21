import axios, { AxiosRequestConfig } from "axios";
import { BigNumber } from "bignumber.js";
import { AccountOnNetwork, TokenOfAccountOnNetwork } from "../account";
import { Address } from "../address";
import { defaultConfig } from "../constants";
import { ErrApiProviderGet, ErrContractQuery } from "../errors";
import { INetworkProvider } from "../interface.networkProvider";
import { Logger } from "../logger";
import { NetworkConfig } from "../networkConfig";
import { NetworkStake } from "../networkStake";
import { NetworkStatus } from "../networkStatus";
import { Query, QueryResponse } from "../smartcontracts";
import { Stats } from "../stats";
import { Token } from "../token";
import { Transaction, TransactionHash, TransactionStatus } from "../transaction";
import { TransactionOnNetwork } from "../transactionOnNetwork";


export class NetworkProxyProvider implements INetworkProvider {
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

    async getAccount(address: Address): Promise<AccountOnNetwork> {
        let response = await this.doGetGeneric(`address/${address.bech32()}`);
        let account = AccountOnNetwork.fromHttpResponse(response.account);
        return account;
    }

    async getAddressEsdtList(address: Address): Promise<TokenOfAccountOnNetwork[]> {
        let url = `address/${address.bech32()}/esdt`;
        let response = await this.doGetGeneric(url);
        let tokens = Object.values(response.esdts).map(item => TokenOfAccountOnNetwork.fromHttpResponse(item));
        return tokens;
    }

    async getAddressEsdt(address: Address, tokenIdentifier: string): Promise<any> {
        let response = await this.doGetGeneric(`address/${address.bech32()}/esdt/${tokenIdentifier}`);
        let tokenData = response.tokenData;
        return tokenData;
    }

    async getAddressNft(address: Address, tokenIdentifier: string, nonce: BigNumber.Value): Promise<any> {
        let response = await this.doGetGeneric(`address/${address.bech32()}/nft/${tokenIdentifier}/nonce/${nonce}`);
        let tokenData = response.tokenData;
        return tokenData;
    }

    async getTransaction(txHash: TransactionHash, hintSender?: Address): Promise<TransactionOnNetwork> {
        let url = this.buildUrlWithQueryParameters(`transaction/${txHash.toString()}`, {
            withSender: hintSender ? hintSender.bech32() : "",
            withResults: "true"
        });

        let response = await this.doGetGeneric(url);
        let transaction = TransactionOnNetwork.fromHttpResponse(txHash, response.transaction);
        return transaction;
    }

    async getTransactionStatus(txHash: TransactionHash): Promise<TransactionStatus> {
        let response = await this.doGetGeneric(`transaction/${txHash.toString()}/status`);
        let status = new TransactionStatus(response.status);
        return status;
    }

    async sendTransaction(tx: Transaction): Promise<TransactionHash> {
        let response = await this.doPostGeneric("transaction/send", tx.toSendable());
        let hash = new TransactionHash(response.txHash)
        return hash;
    }

    async simulateTransaction(tx: Transaction): Promise<any> {
        let response = await this.doPostGeneric("transaction/simulate", tx.toSendable(), (response) => response);
        return response;
    }

    async queryContract(query: Query): Promise<QueryResponse> {
        try {
            let data = query.toHttpRequest();
            let response = await this.doPostGeneric("vm-values/query", data);
            let queryResponse = QueryResponse.fromHttpResponse(response.data || response.vmOutput)
            return queryResponse;
        } catch (err: any) {
            throw ErrContractQuery.increaseSpecificity(err);
        }
    }

    getNetworkStake(): Promise<NetworkStake> {
        // TODO: Implement wrt.:
        // https://github.com/ElrondNetwork/api.elrond.com/blob/main/src/endpoints/stake/stake.service.ts
        throw new Error("Method not implemented.");
    }

    getNetworkStats(): Promise<Stats> {
        // TODO: Implement wrt. (full implementation may not be possible):
        // https://github.com/ElrondNetwork/api.elrond.com/blob/main/src/endpoints/network/network.service.ts
        throw new Error("Method not implemented.");
    }

    getToken(_tokenIdentifier: string): Promise<Token> {
        // TODO: Implement wrt.:
        // https://github.com/ElrondNetwork/api.elrond.com/blob/main/src/endpoints/esdt/esdt.service.ts#L221
        throw new Error("Method not implemented.");
    }

    getDefinitionOfTokenCollection(): Promise<any> {
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
