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
import { NFTToken } from "../nftToken";
import { Query, QueryResponse } from "../smartcontracts";
import { getHexMagnitudeOfBigInt } from "../smartcontracts/codec/utils";
import { Stats } from "../stats";
import { Token } from "../token";
import { Transaction, TransactionHash, TransactionStatus } from "../transaction";
import { TransactionOnNetwork } from "../transactionOnNetwork";
import { ProxyNetworkProvider } from "./proxyNetworkProvider";

/**
 * This is a temporary change, this will be the only provider used, ProxyProvider will be deprecated
 */
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

    async getNetworkStake(): Promise<NetworkStake> {
        let response = await this.doGetGeneric("stake");
        let networkStake = NetworkStake.fromHttpResponse(response)
        return networkStake;
    }

    async getNetworkStats(): Promise<Stats> {
        let response = await this.doGetGeneric("stats");
        let stats = Stats.fromHttpResponse(response)
        return stats;
    }

    async getAccount(address: Address): Promise<AccountOnNetwork> {
        let response = await this.doGetGeneric(`accounts/${address.bech32()}`);
        let account = AccountOnNetwork.fromHttpResponse(response);
        return account;
    }

    async getAddressEsdtList(address: Address): Promise<TokenOfAccountOnNetwork[]> {
        let url = `accounts/${address.bech32()}/tokens`;
        let response: any[] = await this.doGetGeneric(url);
        let tokens = response.map(item => TokenOfAccountOnNetwork.fromHttpResponse(item));
        return tokens;
    }

    async getAddressEsdt(address: Address, tokenIdentifier: string): Promise<any> {
        let response = await this.doGetGeneric(`accounts/${address.bech32()}/tokens/${tokenIdentifier}`);
        let tokenData = response.tokenData;
        return tokenData;
    }

    async getAddressNft(address: Address, collection: string, nonce: BigNumber.Value): Promise<any> {
        let nonceHex = getHexMagnitudeOfBigInt(new BigNumber(nonce));
        let response = await this.doGetGeneric(`accounts/${address.bech32()}/nfts/${collection}-${nonceHex}`);
        let tokenData = response.tokenData;
        return tokenData;
    }

    async getTransaction(txHash: TransactionHash): Promise<TransactionOnNetwork> {
        let response = await this.doGetGeneric(`transactions/${txHash.toString()}`);
        let transaction = TransactionOnNetwork.fromHttpResponse(txHash, response.transaction);
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

    async getToken(tokenIdentifier: string): Promise<Token> {
        let response = await this.doGetGeneric(`tokens/${tokenIdentifier}`);
        let token = Token.fromHttpResponse(response);
        return token;
    }

    async getNFTToken(tokenIdentifier: string): Promise<NFTToken> {
        let response = await this.doGetGeneric(`nfts/${tokenIdentifier}`);
        let token = NFTToken.fromHttpResponse(response);
        return token;
    }

    async getDefinitionOfTokenCollection(collection: string): Promise<any> {
        let response = await this.doGetGeneric(`collections/${collection}`);
        return response;
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
