import { createProxyNetworkProvider } from "@elrondnetwork/erdjs-network-providers";
import { IBech32Address, IHash } from "../interface";
import { IAccountOnNetwork, IContractQueryResponse, INetworkConfig, ITransactionOnNetwork, ITransactionStatus } from "../interfaceOfNetwork";
import { Query } from "../smartcontracts/query";
import { Transaction } from "../transaction";

export function createLocalnetProvider(): INetworkProvider {
    return createProxyNetworkProvider("http://localhost:7950", { timeout: 5000 });
}

export interface INetworkProvider {
    getNetworkConfig(): Promise<INetworkConfig>;
    getAccount(address: IBech32Address): Promise<IAccountOnNetwork>;
    getTransaction(txHash: IHash): Promise<ITransactionOnNetwork>;
    getTransactionStatus(txHash: IHash): Promise<ITransactionStatus>;
    sendTransaction(tx: Transaction): Promise<IHash>;
    simulateTransaction(tx: Transaction): Promise<any>;
    queryContract(query: Query): Promise<IContractQueryResponse>;
}
