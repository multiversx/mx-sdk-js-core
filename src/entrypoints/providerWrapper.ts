import { ProxyNetworkProvider, TransactionOnNetwork } from "../networkProviders";
import { INetworkProvider } from "../networkProviders/interface";

// This will be deleted in future version
export class ProviderWrapper {
    private networkProvider: INetworkProvider;

    constructor(provider: INetworkProvider) {
        this.networkProvider = provider;
    }

    getTransaction(txHash: string): Promise<TransactionOnNetwork> {
        if (this.networkProvider instanceof ProxyNetworkProvider) {
            return this.networkProvider.getTransaction(txHash, true);
        }
        return this.networkProvider.getTransaction(txHash);
    }
}
