import { AxiosRequestConfig } from "axios";
import BigNumber from "bignumber.js";
import { IAddress, IContractQuery, IHash, ITransaction } from "./interface";
import { ProxyNetworkProvider } from "./proxyNetworkProvider";
import { ContractQueryResponse } from "./contractQueryResponse";
import { AccountOnNetwork } from "./accounts";
import { FungibleTokenOfAccountOnNetwork } from "./tokens";
import { TransactionStatus } from "./transactionStatus";
import { TransactionOnNetwork } from "./transactions";
import { NetworkConfig } from "./networkConfig";
import { NetworkStatus } from "./networkStatus";
import { Nonce } from "./primitives";

/**
 * @deprecated
 */
export class DeprecatedProxyProvider {
    private readonly backingProvider: ProxyNetworkProvider;

    constructor(url: string, config?: AxiosRequestConfig) {
        this.backingProvider = new ProxyNetworkProvider(url, config);
    }

    async getAccount(address: IAddress): Promise<AccountOnNetwork> {
        return await this.backingProvider.getAccount(address);
    }

    async getAddressEsdtList(address: IAddress): Promise<FungibleTokenOfAccountOnNetwork[]> {
        return await this.backingProvider.getFungibleTokensOfAccount(address);
    }

    async getAddressEsdt(address: IAddress, tokenIdentifier: string): Promise<any> {
        return await this.backingProvider.getFungibleTokenOfAccount(address, tokenIdentifier);
    }

    async getAddressNft(address: IAddress, tokenIdentifier: string, nonce: BigNumber): Promise<any> {
        return await this.backingProvider.getNonFungibleTokenOfAccount(address, tokenIdentifier, new Nonce(nonce.toNumber()));
    }

    async queryContract(query: IContractQuery): Promise<ContractQueryResponse> {
        return await this.backingProvider.queryContract(query);
    }

    async sendTransaction(tx: ITransaction): Promise<IHash> {
        return await this.backingProvider.sendTransaction(tx);
    }

    async simulateTransaction(tx: ITransaction): Promise<any> {
        return await this.backingProvider.simulateTransaction(tx);
    }

    async getTransaction(txHash: IHash): Promise<TransactionOnNetwork> {
        return await this.backingProvider.getTransaction(txHash);
    }

    async getTransactionStatus(txHash: IHash): Promise<TransactionStatus> {
        return await this.backingProvider.getTransactionStatus(txHash);
    }

    async getNetworkConfig(): Promise<NetworkConfig> {
        return await this.backingProvider.getNetworkConfig();
    }

    async getNetworkStatus(): Promise<NetworkStatus> {
        return await this.backingProvider.getNetworkStatus();
    }

    async doGetGeneric(resourceUrl: string): Promise<any> {
        return await this.backingProvider.doGetGeneric(resourceUrl);
    }

    async doPostGeneric(resourceUrl: string, payload: any): Promise<any> {
        return await this.backingProvider.doPostGeneric(resourceUrl, payload);
    }
}
