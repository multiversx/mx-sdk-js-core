import { AxiosRequestConfig } from "axios";
import BigNumber from "bignumber.js";
import { IAddress, IContractQuery, IHash, ITransaction } from "../../networkProvider/interface";
import { ProxyNetworkProvider } from "../../networkProvider/proxyNetworkProvider";
import { ContractQueryResponse } from "../../networkProvider/contractQueryResponse";
import { AccountOnNetwork } from "../../networkProvider/accounts";
import { FungibleTokenOfAccountOnNetwork } from "../../networkProvider/tokens";
import { TransactionStatus } from "../../networkProvider/transactionStatus";
import { TransactionOnNetwork } from "../../networkProvider/transactions";
import { NetworkConfig } from "../../networkProvider/networkConfig";
import { NetworkStatus } from "../../networkProvider/networkStatus";
import { Nonce } from "../../networkProvider/primitives";
import { IProvider } from "./interface";

/**
 * The contract wrappers require an adapted interface of the proxy provider.
 */
export class ProxyProviderAdapter implements IProvider {
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
}
