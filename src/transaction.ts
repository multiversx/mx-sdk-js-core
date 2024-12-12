import { BigNumber } from "bignumber.js";
import { Address } from "./address";
import { TRANSACTION_MIN_GAS_PRICE, TRANSACTION_OPTIONS_DEFAULT, TRANSACTION_VERSION_DEFAULT } from "./constants";
import { TransactionsConverter } from "./converters/transactionsConverter";
import { Hash } from "./hash";
import {
    IAddress,
    IChainID,
    IGasLimit,
    IGasPrice,
    INonce,
    IPlainTransactionObject,
    ISignature,
    ITransactionOptions,
    ITransactionPayload,
    ITransactionValue,
    ITransactionVersion,
} from "./interface";
import { INetworkConfig } from "./interfaceOfNetwork";
import { TransactionOptions, TransactionVersion } from "./networkParams";
import { interpretSignatureAsBuffer } from "./signature";
import { TransactionComputer } from "./transactionComputer";
import { TransactionPayload } from "./transactionPayload";

/**
 * An abstraction for creating and signing transactions.
 */
export class Transaction {
    /**
     * The nonce of the transaction (the account sequence number of the sender).
     */
    public nonce: bigint;

    /**
     * The value to transfer.
     */
    public value: bigint;

    /**
     * The address of the sender, in bech32 format.
     */
    public sender: string;

    /**
     * The address of the receiver, in bech32 format.
     */
    public receiver: string;

    /**
     * The username of the sender.
     */
    public senderUsername: string;

    /**
     * The username of the receiver.
     */
    public receiverUsername: string;

    /**
     * The gas price to be used.
     */
    public gasPrice: bigint;

    /**
     * The maximum amount of gas to be consumed when processing the transaction.
     */
    public gasLimit: bigint;

    /**
     * The payload of the transaction.
     */
    public data: Uint8Array;

    /**
     * The chain ID of the Network (e.g. "1" for Mainnet).
     */
    public chainID: string;

    /**
     * The version, required by the Network in order to correctly interpret the contents of the transaction.
     */
    public version: number;

    /**
     * The options field, useful for describing different settings available for transactions.
     */
    public options: number;

    /**
     * The address of the guardian, in bech32 format.
     */
    public guardian: string;

    /**
     * The relayer address.
     *  Note: in the next major version, `sender`, `receiver` and `guardian` will also have the type `Address`, instead of `string`.
     */
    public relayer: Address;

    /**
     * The signature.
     */
    public signature: Uint8Array;

    /**
     * The signature of the guardian.
     */
    public guardianSignature: Uint8Array;

    /**
     * The signature of the relayer.
     */
    public relayerSignature: Uint8Array;

    /**
     * Creates a new Transaction object.
     */
    public constructor(options: {
        nonce?: INonce | bigint;
        value?: ITransactionValue | bigint;
        sender: IAddress | string;
        receiver: IAddress | string;
        relayer?: Address;
        senderUsername?: string;
        receiverUsername?: string;
        gasPrice?: IGasPrice | bigint;
        gasLimit: IGasLimit | bigint;
        data?: ITransactionPayload | Uint8Array;
        chainID: IChainID | string;
        version?: ITransactionVersion | number;
        options?: ITransactionOptions | number;
        guardian?: IAddress | string;
        signature?: Uint8Array;
        guardianSignature?: Uint8Array;
        relayerSignature?: Uint8Array;
    }) {
        this.nonce = BigInt(options.nonce?.valueOf() || 0n);
        // We still rely on "bigNumber" for value, because client code might be passing a BigNumber object as a legacy "ITransactionValue",
        // and we want to keep compatibility.
        this.value = options.value ? BigInt(new BigNumber(options.value.toString()).toFixed(0)) : 0n;
        this.sender = this.addressAsBech32(options.sender);
        this.receiver = this.addressAsBech32(options.receiver);
        this.senderUsername = options.senderUsername || "";
        this.receiverUsername = options.receiverUsername || "";
        this.gasPrice = BigInt(options.gasPrice?.valueOf() || TRANSACTION_MIN_GAS_PRICE);
        this.gasLimit = BigInt(options.gasLimit.valueOf());
        this.data = options.data?.valueOf() || new Uint8Array();
        this.chainID = options.chainID.valueOf();
        this.version = Number(options.version?.valueOf() || TRANSACTION_VERSION_DEFAULT);
        this.options = Number(options.options?.valueOf() || TRANSACTION_OPTIONS_DEFAULT);
        this.guardian = options.guardian ? this.addressAsBech32(options.guardian) : "";
        this.relayer = options.relayer ? options.relayer : Address.empty();

        this.signature = options.signature || Buffer.from([]);
        this.guardianSignature = options.guardianSignature || Buffer.from([]);
        this.relayerSignature = options.relayerSignature || Buffer.from([]);
    }

    private addressAsBech32(address: IAddress | string): string {
        return typeof address === "string" ? address : address.bech32();
    }

    /**
     * Legacy method, use the "nonce" property instead.
     */
    getNonce(): INonce {
        return Number(this.nonce);
    }

    /**
     * Legacy method, use the "nonce" property instead.
     * Sets the account sequence number of the sender. Must be done prior signing.
     */
    setNonce(nonce: INonce | bigint) {
        this.nonce = BigInt(nonce.valueOf());
    }

    /**
     * Legacy method, use the "value" property instead.
     */
    getValue(): ITransactionValue {
        return this.value;
    }

    /**
     * Legacy method, use the "value" property instead.
     */
    setValue(value: ITransactionValue | bigint) {
        this.value = BigInt(value.toString());
    }

    /**
     * Legacy method, use the "sender" property instead.
     */
    getSender(): IAddress {
        return Address.fromBech32(this.sender);
    }

    /**
     * Legacy method, use the "sender" property instead.
     */
    setSender(sender: IAddress | string) {
        this.sender = typeof sender === "string" ? sender : sender.bech32();
    }

    /**
     * Legacy method, use the "receiver" property instead.
     */
    getReceiver(): IAddress {
        return Address.fromBech32(this.receiver);
    }

    /**
     * Legacy method, use the "senderUsername" property instead.
     */
    getSenderUsername(): string {
        return this.senderUsername;
    }

    /**
     * Legacy method, use the "senderUsername" property instead.
     */
    setSenderUsername(senderUsername: string) {
        this.senderUsername = senderUsername;
    }

    /**
     * Legacy method, use the "receiverUsername" property instead.
     */
    getReceiverUsername(): string {
        return this.receiverUsername;
    }

    /**
     * Legacy method, use the "receiverUsername" property instead.
     */
    setReceiverUsername(receiverUsername: string) {
        this.receiverUsername = receiverUsername;
    }

    /**
     * Legacy method, use the "guardian" property instead.
     */
    getGuardian(): IAddress {
        return new Address(this.guardian);
    }

    /**
     * Legacy method, use the "gasPrice" property instead.
     */
    getGasPrice(): IGasPrice {
        return Number(this.gasPrice);
    }

    /**
     * Legacy method, use the "gasPrice" property instead.
     */
    setGasPrice(gasPrice: IGasPrice | bigint) {
        this.gasPrice = BigInt(gasPrice.valueOf());
    }

    /**
     * Legacy method, use the "gasLimit" property instead.
     */
    getGasLimit(): IGasLimit {
        return Number(this.gasLimit);
    }

    /**
     * Legacy method, use the "gasLimit" property instead.
     */
    setGasLimit(gasLimit: IGasLimit | bigint) {
        this.gasLimit = BigInt(gasLimit.valueOf());
    }

    /**
     * Legacy method, use the "data" property instead.
     */
    getData(): ITransactionPayload {
        return new TransactionPayload(Buffer.from(this.data));
    }

    /**
     * Legacy method, use the "chainID" property instead.
     */
    getChainID(): IChainID {
        return this.chainID;
    }

    /**
     * Legacy method, use the "chainID" property instead.
     */
    setChainID(chainID: IChainID | string) {
        this.chainID = chainID.valueOf();
    }

    /**
     * Legacy method, use the "version" property instead.
     */
    getVersion(): TransactionVersion {
        return new TransactionVersion(this.version);
    }

    /**
     * Legacy method, use the "version" property instead.
     */
    setVersion(version: ITransactionVersion | number) {
        this.version = version.valueOf();
    }

    /**
     * Legacy method, use the "options" property instead.
     */
    getOptions(): TransactionOptions {
        return new TransactionOptions(this.options.valueOf());
    }

    /**
     * Legacy method, use the "options" property instead.
     *
     * Question for review: check how the options are set by sdk-dapp, wallet, ledger, extension.
     */
    setOptions(options: ITransactionOptions | number) {
        this.options = options.valueOf();
    }

    /**
     * Legacy method, use the "signature" property instead.
     */
    getSignature(): Buffer {
        return Buffer.from(this.signature);
    }

    /**
     * Legacy method, use the "guardianSignature" property instead.
     */
    getGuardianSignature(): Buffer {
        return Buffer.from(this.guardianSignature);
    }

    /**
     * Legacy method, use the "guardian" property instead.
     */
    setGuardian(guardian: IAddress | string) {
        this.guardian = typeof guardian === "string" ? guardian : guardian.bech32();
    }

    /**
     * Legacy method, use "TransactionComputer.computeTransactionHash()" instead.
     */
    getHash(): TransactionHash {
        return TransactionHash.compute(this);
    }

    /**
     * Legacy method, use "TransactionComputer.computeBytesForSigning()" instead.
     * Serializes a transaction to a sequence of bytes, ready to be signed.
     * This function is called internally by signers.
     */
    serializeForSigning(): Buffer {
        const computer = new TransactionComputer();
        const bytes = computer.computeBytesForSigning(this);
        return Buffer.from(bytes);
    }

    /**
     * Checks the integrity of the guarded transaction
     */
    isGuardedTransaction(): boolean {
        const hasGuardian = this.guardian.length > 0;
        const hasGuardianSignature = this.guardianSignature.length > 0;
        return this.getOptions().isWithGuardian() && hasGuardian && hasGuardianSignature;
    }

    /**
     * Legacy method, use "TransactionsConverter.transactionToPlainObject()" instead.
     *
     * Converts the transaction object into a ready-to-serialize, plain JavaScript object.
     * This function is called internally within the signing procedure.
     */
    toPlainObject(): IPlainTransactionObject {
        // Ideally, "converters" package should be outside of "core", and not referenced here.
        const converter = new TransactionsConverter();
        return converter.transactionToPlainObject(this);
    }

    /**
     * Legacy method, use "TransactionsConverter.plainObjectToTransaction()" instead.
     * Converts a plain object transaction into a Transaction Object.
     *
     * @param plainObjectTransaction Raw data of a transaction, usually obtained by calling toPlainObject()
     */
    static fromPlainObject(plainObjectTransaction: IPlainTransactionObject): Transaction {
        // Ideally, "converters" package should be outside of "core", and not referenced here.
        const converter = new TransactionsConverter();
        return converter.plainObjectToTransaction(plainObjectTransaction);
    }

    /**
     * Legacy method, use the "signature" property instead.
     * Applies the signature on the transaction.
     *
     * @param signature The signature, as computed by a signer.
     */
    applySignature(signature: ISignature | Uint8Array) {
        this.signature = interpretSignatureAsBuffer(signature);
    }

    /**
     * Legacy method, use the "guardianSignature" property instead.
     * Applies the guardian signature on the transaction.
     *
     * @param guardianSignature The signature, as computed by a signer.
     */
    applyGuardianSignature(guardianSignature: ISignature | Uint8Array) {
        this.guardianSignature = interpretSignatureAsBuffer(guardianSignature);
    }

    /**
     * Converts a transaction to a ready-to-broadcast object.
     * Called internally by the network provider.
     */
    toSendable(): any {
        return this.toPlainObject();
    }

    /**
     * Legacy method, use "TransactionComputer.computeTransactionFee()" instead.
     *
     * Computes the current transaction fee based on the {@link NetworkConfig} and transaction properties
     * @param networkConfig {@link NetworkConfig}
     */
    computeFee(networkConfig: INetworkConfig): BigNumber {
        const computer = new TransactionComputer();
        const fee = computer.computeTransactionFee(this, networkConfig);
        return new BigNumber(fee.toString());
    }
}

/**
 * Legacy class, use "TransactionComputer.computeTransactionHash()" instead.
 * An abstraction for handling and computing transaction hashes.
 */
export class TransactionHash extends Hash {
    constructor(hash: string) {
        super(hash);
    }

    /**
     * Legacy method, use "TransactionComputer.computeTransactionHash()" instead.
     * Computes the hash of a transaction.
     */
    static compute(transaction: Transaction): TransactionHash {
        const computer = new TransactionComputer();
        const hash = computer.computeTransactionHash(transaction);
        return new TransactionHash(Buffer.from(hash).toString("hex"));
    }
}
