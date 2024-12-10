import { BigNumber } from "bignumber.js";
import { Address } from "./address";
import { TRANSACTION_MIN_GAS_PRICE, TRANSACTION_OPTIONS_DEFAULT, TRANSACTION_VERSION_DEFAULT } from "./constants";
import { TransactionsConverter } from "./converters/transactionsConverter";
import { Hash } from "./hash";
import { IGasLimit, IGasPrice, INonce, IPlainTransactionObject, ISignature, ITransactionValue } from "./interface";
import { INetworkConfig } from "./interfaceOfNetwork";
import { interpretSignatureAsBuffer } from "./signature";
import { TransactionComputer } from "./transactionComputer";

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
     * The address of the sender.
     */
    public sender: Address;

    /**
     * The address of the receiver.
     */
    public receiver: Address;

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
    public guardian: Address;

    /**
     * The signature.
     */
    public signature: Uint8Array;

    /**
     * The signature of the guardian.
     */
    public guardianSignature: Uint8Array;

    /**
     * Creates a new Transaction object.
     */
    public constructor(options: {
        nonce?: bigint;
        value?: bigint;
        sender: Address;
        receiver: Address;
        senderUsername?: string;
        receiverUsername?: string;
        gasPrice?: bigint;
        gasLimit: bigint;
        data?: Uint8Array;
        chainID: string;
        version?: number;
        options?: number;
        guardian?: Address;
        signature?: Uint8Array;
        guardianSignature?: Uint8Array;
    }) {
        this.nonce = BigInt(options.nonce?.valueOf() || 0n);
        // We still rely on "bigNumber" for value, because client code might be passing a BigNumber object as a legacy "ITransactionValue",
        // and we want to keep compatibility.
        this.value = options.value ? BigInt(new BigNumber(options.value.toString()).toFixed(0)) : 0n;
        this.sender = options.sender;
        this.receiver = options.receiver;
        this.senderUsername = options.senderUsername || "";
        this.receiverUsername = options.receiverUsername || "";
        this.gasPrice = BigInt(options.gasPrice?.valueOf() || TRANSACTION_MIN_GAS_PRICE);
        this.gasLimit = BigInt(options.gasLimit.valueOf());
        this.data = options.data?.valueOf() || new Uint8Array();
        this.chainID = options.chainID.valueOf();
        this.version = Number(options.version?.valueOf() || TRANSACTION_VERSION_DEFAULT);
        this.options = Number(options.options?.valueOf() || TRANSACTION_OPTIONS_DEFAULT);
        this.guardian = options.guardian ?? Address.empty();

        this.signature = options.signature || Buffer.from([]);
        this.guardianSignature = options.guardianSignature || Buffer.from([]);
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
    getSender(): Address {
        return this.sender;
    }

    /**
     * Legacy method, use the "sender" property instead.
     */
    setSender(sender: Address) {
        this.sender = sender;
    }

    /**
     * Legacy method, use the "receiver" property instead.
     */
    getReceiver(): Address {
        return this.receiver;
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
    getGuardian(): Address {
        return this.guardian;
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
    getData(): Uint8Array {
        return this.data;
    }

    /**
     * Legacy method, use the "chainID" property instead.
     */
    getChainID(): string {
        return this.chainID;
    }

    /**
     * Legacy method, use the "chainID" property instead.
     */
    setChainID(chainID: string) {
        this.chainID = chainID;
    }

    /**
     * Legacy method, use the "version" property instead.
     */
    getVersion(): number {
        return this.version;
    }

    /**
     * Legacy method, use the "version" property instead.
     */
    setVersion(version: number) {
        this.version = version;
    }

    /**
     * Legacy method, use the "options" property instead.
     */
    getOptions(): number {
        return this.options;
    }

    /**
     * Legacy method, use the "options" property instead.
     *
     * Question for review: check how the options are set by sdk-dapp, wallet, ledger, extension.
     */
    setOptions(options: number) {
        this.options = options;
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
    setGuardian(guardian: Address) {
        this.guardian = guardian;
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
        const hasGuardian = !this.guardian.isEmpty;
        const hasGuardianSignature = this.guardianSignature.length > 0;
        return hasGuardian && hasGuardianSignature;
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
