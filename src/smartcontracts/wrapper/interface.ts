import BigNumber from "bignumber.js";
import { IBech32Address, IHash } from "../../interface";
import { IAccountOnNetwork, IContractQueryResponse, IFungibleTokenOfAccountOnNetwork, INetworkConfig, INetworkStatus, ITransactionOnNetwork, ITransactionStatus } from "../../interfaceOfNetwork";
import { Transaction } from "../../transaction";
import { Query } from "../query";

/**
 * @deprecated
 */
export interface IDeprecatedProvider {
    getTransaction(txHash: IHash, hintSender?: IBech32Address, withResults?: boolean): Promise<ITransactionOnNetwork>;
    getTransactionStatus(txHash: IHash): Promise<ITransactionStatus>;
    getNetworkConfig(): Promise<INetworkConfig>;
    getNetworkStatus(): Promise<INetworkStatus>;
    getAccount(address: IBech32Address): Promise<IAccountOnNetwork>;
    getAddressEsdtList(address: IBech32Address): Promise<IFungibleTokenOfAccountOnNetwork[]>;
    getAddressEsdt(address: IBech32Address, tokenIdentifier: string): Promise<any>;
    getAddressNft(address: IBech32Address, tokenIdentifier: string, nonce: BigNumber): Promise<any>;
    queryContract(query: Query): Promise<IContractQueryResponse>;
    sendTransaction(tx: Transaction): Promise<IHash>;
    simulateTransaction(tx: Transaction): Promise<IHash>;
    doGetGeneric(resourceUrl: string, callback: (response: any) => any): Promise<any>;
    doPostGeneric(resourceUrl: string, payload: any, callback: (response: any) => any): Promise<any>;
}
