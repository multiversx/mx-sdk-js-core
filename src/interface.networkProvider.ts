import { BigNumber } from "bignumber.js";
import { AccountOnNetwork, TokenOfAccountOnNetwork } from "./account";
import { Address } from "./address";
import { NetworkConfig } from "./networkConfig";
import { NetworkStake } from "./networkStake";
import { NetworkStatus } from "./networkStatus";
import { NFTToken } from "./nftToken";
import { Query, QueryResponse } from "./smartcontracts";
import { Stats } from "./stats";
import { Token } from "./token";
import { Transaction, TransactionHash, TransactionStatus } from "./transaction";
import { TransactionOnNetwork } from "./transactionOnNetwork";

/**
 * An interface that defines the endpoints of an HTTP API Provider.
 */
export interface INetworkProvider {
    /**
     * Fetches the Network configuration.
     */
    getNetworkConfig(): Promise<NetworkConfig>;

    /**
     * Fetches the Network status.
     */
    getNetworkStatus(): Promise<NetworkStatus>;

    /**
     * Fetches the Network Stake.
     * 
     * TODO: Rename to "GetNetworkStakeStatistics" (not renamed yet in order to preserve interface compatibility).
     */
    getNetworkStake(): Promise<NetworkStake>;

    /**
     * Fetches the Network Stats.
     * 
     * TODO: Rename to "GetNetworkGeneralStatistics" (not renamed yet in order to preserve interface compatibility).
     */
    getNetworkStats(): Promise<Stats>;

    /**
     * Fetches the state of an {@link Account}.
     */
    getAccount(address: Address): Promise<AccountOnNetwork>;

    /**
     * Fetches all the tokens (fungible, SFT, NFT) of an account. It does NOT return the definition of tokens.
     * It returns token balance and token instance properties.
     * 
     * TODO: Rename to "GetTokensOfAccount" (not renamed yet in order to preserve interface compatibility).
     */
    getAddressEsdtList(address: Address): Promise<TokenOfAccountOnNetwork[]>;

    /**
     * Fetches information about a fungible token of an account.
     * 
     * TODO: Return explicit type.
     * TODO: Rename to "GetFungibleTokenOfAccount" (not renamed yet in order to preserve interface compatibility).
     */
    getAddressEsdt(address: Address, tokenIdentifier: string): Promise<any>;

    /**
     * Fetches information about a specific token (instance) of an account (works for SFT, Meta ESDT, NFT).
     *
     * TODO: Return explicit type.
     * TODO: Rename to "GetTokenInstanceOfAccount" (not renamed yet in order to preserve interface compatibility).
     */
    getAddressNft(address: Address, collection: string, nonce: BigNumber.Value): Promise<any>;

    /**
     * Fetches the state of a {@link Transaction}.
     */
    getTransaction(txHash: TransactionHash, hintSender?: Address): Promise<TransactionOnNetwork>;

    /**
     * Queries the status of a {@link Transaction}.
     */
    getTransactionStatus(txHash: TransactionHash): Promise<TransactionStatus>;

    /**
     * Broadcasts an already-signed {@link Transaction}.
     */
    sendTransaction(tx: Transaction): Promise<TransactionHash>;

    /**
     * Simulates the processing of an already-signed {@link Transaction}.
     * 
     * TODO: Return explicit type.
     */
    simulateTransaction(tx: Transaction): Promise<TransactionHash>;

    /**
     * Queries a Smart Contract - runs a pure function defined by the contract and returns its results.
     */
    queryContract(query: Query): Promise<QueryResponse>;

    /**
     * Fetches the definition of a fungible token.
     * 
     * TODO: Rename to "GetDefinitionOfFungibleToken" or "GetFungibleTokenDefinition" (not renamed yet in order to preserve interface compatibility).
     */
    getToken(tokenIdentifier: string): Promise<Token>;

    /**
     * Fetches the definition of a SFT (including Meta ESDT) or NFT.
     * 
     * TODO: Return explicit type.
     */
    getDefinitionOfTokenCollection(collection: string): Promise<any>;

    /**
     * Fetches an instance of a SFT (including Meta ESDT) or NFT.
     * 
     * TODO: Rename to "GetTokenInstance" (not renamed yet in order to preserve interface compatibility).
     */
    getNFTToken(tokenIdentifier: string): Promise<NFTToken>;

    /**
     * Performs a generic GET action against the provider (useful for new HTTP endpoints, not yet supported by erdjs).
     */
    doGetGeneric(resourceUrl: string): Promise<any>;

    /**
     * Performs a generic POST action against the provider (useful for new HTTP endpoints, not yet supported by erdjs).
     */
    doPostGeneric(resourceUrl: string, payload: any): Promise<any>;
}
