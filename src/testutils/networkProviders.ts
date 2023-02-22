import { ApiNetworkProvider, ProxyNetworkProvider } from "@multiversx/sdk-network-providers";
import { IAddress } from "../interface";
import { IAccountOnNetwork, IContractQueryResponse, INetworkConfig, ITransactionOnNetwork, ITransactionStatus } from "../interfaceOfNetwork";
import { Query } from "../smartcontracts/query";
import { Transaction } from "../transaction";

export function createLocalnetProvider(): INetworkProvider {
    return new ProxyNetworkProvider("http://localhost:7950", { timeout: 5000 });
}

export function createTestnetProvider(): INetworkProvider {
    return new ApiNetworkProvider("https://testnet-api.multiversx.com", { timeout: 5000 });
}

export interface INetworkProvider {
    getNetworkConfig(): Promise<INetworkConfig>;
    getAccount(address: IAddress): Promise<IAccountOnNetwork>;
    getTransaction(txHash: string): Promise<ITransactionOnNetwork>;
    getTransactionStatus(txHash: string): Promise<ITransactionStatus>;
    sendTransaction(tx: Transaction): Promise<string>;
    simulateTransaction(tx: Transaction): Promise<any>;
    queryContract(query: Query): Promise<IContractQueryResponse>;
}
