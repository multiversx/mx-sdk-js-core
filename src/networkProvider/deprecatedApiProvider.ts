import axios, { AxiosRequestConfig } from "axios";
import { IHash } from "./interface";
import * as errors from "./errors";
import { NFTToken } from "./nftToken";
import { defaultAxiosConfig } from "./config";
import { ApiNetworkProvider } from "./apiNetworkProvider";
import { TransactionOnNetwork } from "./transactions";
import { Stats } from "./stats";
import { NetworkStake } from "./networkStake";
import { TransactionStatus } from "./transactionStatus";
import { DefinitionOfFungibleTokenOnNetwork } from "./tokenDefinitions";

/**
 * @deprecated
 */
export class DeprecatedApiProvider {
    private url: string;
    private config: AxiosRequestConfig;
    /**
     * @deprecated used only for preparatory refactoring (unifying network providers)
     */
    private readonly backingProvider: ApiNetworkProvider;

    /**
     * Creates a new ApiProvider.
     * @param url the URL of the Elrond Api
     * @param config axios request config options
     */
    constructor(url: string, config?: AxiosRequestConfig) {
      this.url = url;
      this.config = {...defaultAxiosConfig, ...config};
      this.backingProvider = new ApiNetworkProvider(url, config);
    }

    /**
     * Fetches the Network Stake.
     */
    async getNetworkStake(): Promise<NetworkStake> {
        return await this.backingProvider.getNetworkStakeStatistics();
    }

    /**
     * Fetches the Network Stats.
     */
    async getNetworkStats(): Promise<Stats> {
        return await this.backingProvider.getNetworkGeneralStatistics();
    }

    /**
     * Fetches the state of a transaction.
     */
    async getTransaction(txHash: IHash): Promise<TransactionOnNetwork> {
        return await this.backingProvider.getTransaction(txHash);
    }

    /**
     * Queries the status of a transaction.
     */
    async getTransactionStatus(txHash: IHash): Promise<TransactionStatus> {
        return await this.backingProvider.getTransactionStatus(txHash);
    }

    async getToken(tokenIdentifier: string): Promise<DefinitionOfFungibleTokenOnNetwork> {
        return await this.backingProvider.getDefinitionOfFungibleToken(tokenIdentifier);
    }

    async getNFTToken(tokenIdentifier: string): Promise<NFTToken> {
        return this.doGetGeneric(`nfts/${tokenIdentifier}`, (response) => NFTToken.fromHttpResponse(response));
    }

    /**
     * Get method that receives the resource url and on callback the method used to map the response.
     */
    async doGetGeneric(resourceUrl: string, callback: (response: any) => any): Promise<any> {
        let response = await this.doGet(resourceUrl);
        return callback(response);
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

    private handleApiError(error: any, resourceUrl: string) {
        if (!error.response) {
            console.warn(error);
            throw new errors.ErrApiProviderGet(resourceUrl, error.toString(), error);
        }

        let errorData = error.response.data;
        let originalErrorMessage = errorData.error || errorData.message || JSON.stringify(errorData);
        throw new errors.ErrApiProviderGet(resourceUrl, originalErrorMessage, error);
    }
}
