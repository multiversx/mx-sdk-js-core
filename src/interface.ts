import { Transaction, TransactionHash, TransactionStatus } from "./transaction";
import { NetworkConfig } from "./networkConfig";
import { Signature } from "./signature";
import { Address } from "./address";
import { AccountOnNetwork, TokenOfAccountOnNetwork } from "./account";
import { Query } from "./smartcontracts";
import { QueryResponse } from "./smartcontracts";
import { NetworkStake } from "./networkStake";
import { Stats } from "./stats";
import { NetworkStatus } from "./networkStatus";
import { TransactionOnNetwork } from "./transactionOnNetwork";
import { Token } from "./token";
import BigNumber from "bignumber.js";

/**
 * @deprecated This interface will be removed in a future release, upon merging {@link IProvider} and {@link IApiProvider}.
 */
export interface ITransactionFetcher {
    /**
     * Fetches the state of a {@link Transaction}.
     */
    getTransaction(txHash: TransactionHash, hintSender?: Address, withResults?: boolean): Promise<TransactionOnNetwork>;

    /**
     * Queries the status of a {@link Transaction}.
     */
    getTransactionStatus(txHash: TransactionHash): Promise<TransactionStatus>;
}

/**
 * An interface that defines the endpoints of an HTTP API Provider.
 */
export interface IProvider extends ITransactionFetcher {
    /**
     * Fetches the Network configuration.
     */
    getNetworkConfig(): Promise<NetworkConfig>;

    /**
     * Fetches the Network status.
     */
    getNetworkStatus(): Promise<NetworkStatus>;

    /**
     * Fetches the state of an {@link Account}.
     */
    getAccount(address: Address): Promise<AccountOnNetwork>;

    /**
     * Fetches the list of ESDT data for all the tokens of an address.
     */
    getAddressEsdtList(address: Address): Promise<TokenOfAccountOnNetwork[]>;

    /**
     * Fetches the ESDT data for a token of an address.
     */
    getAddressEsdt(address: Address, tokenIdentifier: string): Promise<any>;

    /**
     * Fetches the NFT data for a token with a given nonce of an address.
     */
    getAddressNft(address: Address, tokenIdentifier: string, nonce: BigNumber): Promise<any>;

    /**
     * Queries a Smart Contract - runs a pure function defined by the contract and returns its results.
     */
    queryContract(query: Query): Promise<QueryResponse>;

    /**
     * Broadcasts an already-signed {@link Transaction}.
     */
    sendTransaction(tx: Transaction): Promise<TransactionHash>;

    /**
     * Simulates the processing of an already-signed {@link Transaction}.
     */
    simulateTransaction(tx: Transaction): Promise<TransactionHash>;

    /**
     * Get method that receives the resource url and on callback the method used to map the response.
     */
    doGetGeneric(resourceUrl: string, callback: (response: any) => any): Promise<any>;

    /**
     * Post method that receives the resource url, the post payload and on callback the method used to map the response.
     */
    doPostGeneric(resourceUrl: string, payload: any, callback: (response: any) => any): Promise<any>;
}

/**
 * An interface that defines the endpoints of an HTTP API Provider.
 */
export interface IApiProvider extends ITransactionFetcher {
    /**
     * Fetches the Network Stake.
     */
    getNetworkStake(): Promise<NetworkStake>;
    /**
     * Fetches the Network Stats.
     */
    getNetworkStats(): Promise<Stats>;

    getToken(tokenIdentifier: string): Promise<Token>;

    /**
     * Get method that receives the resource url and on callback the method used to map the response.
     */
    doGetGeneric(resourceUrl: string, callback: (response: any) => any): Promise<any>;
}

/**
 * An interface that defines a signable object (e.g. a {@link Transaction}).
 */
export interface ISignable {
    /**
     * Returns the signable object in its raw form - a sequence of bytes to be signed.
     */
    serializeForSigning(signedBy: IAddressOfSigner): Buffer;

    /**
     * Applies the computed signature on the object itself.
     *
     * @param signature The computed signature
     * @param signedBy The address of the signer
     */
    applySignature(signature: ISignatureOfSignable, signedBy: IAddressOfSigner): void;
}

/**
 * Interface that defines a signed and verifiable object
 */
export interface IVerifiable {
    /**
     * Returns the signature that should be verified
     */
    getSignature(): Signature;
    /**
     * Returns the signable object in its raw form - a sequence of bytes to be verified.
     */
    serializeForSigning(signedBy?: Address): Buffer;
}

/**
 * An interface that defines a disposable object.
 */
export interface Disposable {
    dispose(): void;
}

export interface ISignatureOfSignable {
    hex(): string;
}

export interface IAddressOfSigner {
    bech32(): string;
}
