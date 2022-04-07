import { Transaction } from "./transaction";
import { Signature } from "./signature";
import { Query } from "./smartcontracts";
import BigNumber from "bignumber.js";
import { IAccountOnNetwork, IContractQueryResponse, IFungibleTokenOfAccountOnNetwork, INetworkConfig, INetworkStake, INetworkStats, INetworkStatus, ITransactionOnNetwork, ITransactionStatus } from "./interfaceOfNetwork";
import { IDefinitionOfFungibleTokenOnNetwork } from "./networkProvider/interface";

/**
 * @deprecated
 */
export interface ITransactionFetcher {
    /**
     * Fetches the state of a {@link Transaction}.
     */
    getTransaction(txHash: IHash, hintSender?: IBech32Address, withResults?: boolean): Promise<ITransactionOnNetwork>;

    /**
     * Queries the status of a {@link Transaction}.
     */
    getTransactionStatus(txHash: IHash): Promise<ITransactionStatus>;
}

/**
 * @deprecated
 */
export interface IProvider extends ITransactionFetcher {
    /**
     * Fetches the Network configuration.
     */
    getNetworkConfig(): Promise<INetworkConfig>;

    /**
     * Fetches the Network status.
     */
    getNetworkStatus(): Promise<INetworkStatus>;

    /**
     * Fetches the state of an {@link Account}.
     */
    getAccount(address: IBech32Address): Promise<IAccountOnNetwork>;

    /**
     * Fetches the list of ESDT data for all the tokens of an address.
     */
    getAddressEsdtList(address: IBech32Address): Promise<IFungibleTokenOfAccountOnNetwork[]>;

    /**
     * Fetches the ESDT data for a token of an address.
     */
    getAddressEsdt(address: IBech32Address, tokenIdentifier: string): Promise<any>;

    /**
     * Fetches the NFT data for a token with a given nonce of an address.
     */
    getAddressNft(address: IBech32Address, tokenIdentifier: string, nonce: BigNumber): Promise<any>;

    /**
     * Queries a Smart Contract - runs a pure function defined by the contract and returns its results.
     */
    queryContract(query: Query): Promise<IContractQueryResponse>;

    /**
     * Broadcasts an already-signed {@link Transaction}.
     */
    sendTransaction(tx: Transaction): Promise<IHash>;

    /**
     * Simulates the processing of an already-signed {@link Transaction}.
     */
    simulateTransaction(tx: Transaction): Promise<IHash>;

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
 * @deprecated
 */
export interface IApiProvider extends ITransactionFetcher {
    /**
     * Fetches the Network Stake.
     */
    getNetworkStake(): Promise<INetworkStake>;
    /**
     * Fetches the Network Stats.
     */
    getNetworkStats(): Promise<INetworkStats>;

    getToken(tokenIdentifier: string): Promise<IDefinitionOfFungibleTokenOnNetwork>;
}

/**
 * An interface that defines a signable object (e.g. a {@link Transaction}).
 */
export interface ISignable {
    /**
     * Returns the signable object in its raw form - a sequence of bytes to be signed.
     */
    serializeForSigning(signedBy: IBech32Address): Buffer;

    /**
     * Applies the computed signature on the object itself.
     *
     * @param signature The computed signature
     * @param signedBy The address of the signer
     */
    applySignature(signature: ISignature, signedBy: IBech32Address): void;
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
    serializeForSigning(signedBy?: IBech32Address): Buffer;
}

/**
 * An interface that defines a disposable object.
 */
export interface Disposable {
    dispose(): void;
}

export interface ISignature { hex(): string; }
export interface IHash { hex(): string; }
export interface IBech32Address { bech32(): string; }
export interface ITransactionValue { toString(): string; }
export interface IAccountBalance { toString(): string; }
export interface ITransactionPayload { encoded(): string; }
export interface INonce { valueOf(): number; }
export interface IChainID { valueOf(): string; }
export interface IGasLimit { valueOf(): number; }
export interface IGasPrice { valueOf(): number; }
