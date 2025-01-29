import { BigNumber } from "bignumber.js";
import { Address } from "./address";
import { TRANSACTION_MIN_GAS_PRICE, TRANSACTION_OPTIONS_DEFAULT, TRANSACTION_VERSION_DEFAULT } from "./constants";
import { IPlainTransactionObject } from "./interface";
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
        relayer?: Address;
        signature?: Uint8Array;
        guardianSignature?: Uint8Array;
        relayerSignature?: Uint8Array;
    }) {
        this.nonce = options.nonce ?? 0n;
        this.value = options.value ?? 0n;
        this.sender = options.sender;
        this.receiver = options.receiver;
        this.senderUsername = options.senderUsername || "";
        this.receiverUsername = options.receiverUsername || "";
        this.gasPrice = options.gasPrice ?? BigInt(TRANSACTION_MIN_GAS_PRICE);
        this.gasLimit = options.gasLimit;
        this.data = options.data ?? new Uint8Array();
        this.chainID = options.chainID.valueOf();
        this.version = options.version ?? TRANSACTION_VERSION_DEFAULT;
        this.options = options.options ?? TRANSACTION_OPTIONS_DEFAULT;
        this.guardian = options.guardian ?? Address.empty();
        this.relayer = options.relayer ? options.relayer : Address.empty();

        this.signature = options.signature || Buffer.from([]);
        this.guardianSignature = options.guardianSignature || Buffer.from([]);
        this.relayerSignature = options.relayerSignature || Buffer.from([]);
    }

    /**
     * Legacy method, use the "nonce" property instead.
     */
    getNonce(): bigint {
        return this.nonce;
    }

    /**
     * Legacy method, use the "nonce" property instead.
     * Sets the account sequence number of the sender. Must be done prior signing.
     */
    setNonce(nonce: bigint) {
        this.nonce = nonce;
    }

    /**
     * Legacy method, use the "value" property instead.
     */
    getValue(): bigint {
        return this.value;
    }

    /**
     * Legacy method, use the "value" property instead.
     */
    setValue(value: bigint) {
        this.value = value;
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
    getGasPrice(): bigint {
        return this.gasPrice;
    }

    /**
     * Legacy method, use the "gasPrice" property instead.
     */
    setGasPrice(gasPrice: bigint) {
        this.gasPrice = gasPrice;
    }

    /**
     * Legacy method, use the "gasLimit" property instead.
     */
    getGasLimit(): bigint {
        return this.gasLimit;
    }

    /**
     * Legacy method, use the "gasLimit" property instead.
     */
    setGasLimit(gasLimit: bigint) {
        this.gasLimit = gasLimit;
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
        const computer = new TransactionComputer();
        const hasGuardian = !this.guardian.isEmpty();
        const hasGuardianSignature = this.guardianSignature.length > 0;
        return computer.hasOptionsSetForGuardedTransaction(this) && hasGuardian && hasGuardianSignature;
    }

    /**
     * Converts the transaction object into a ready-to-serialize, plain JavaScript object.
     * This function is called internally within the signing procedure.
     */
    toPlainObject(): IPlainTransactionObject {
        const plainObject = {
            nonce: Number(this.nonce),
            value: this.value.toString(),
            receiver: this.receiver.toBech32(),
            sender: this.sender.toBech32(),
            senderUsername: this.toBase64OrUndefined(this.senderUsername),
            receiverUsername: this.toBase64OrUndefined(this.receiverUsername),
            gasPrice: Number(this.gasPrice),
            gasLimit: Number(this.gasLimit),
            data: this.toBase64OrUndefined(this.data),
            chainID: this.chainID.valueOf(),
            version: this.version,
            options: this.options == 0 ? undefined : this.options,
            guardian: this.guardian.isEmpty() ? undefined : this.guardian.toBech32(),
            relayer: this.relayer.isEmpty() ? undefined : this.relayer.toBech32(),
            signature: this.toHexOrUndefined(this.signature),
            guardianSignature: this.toHexOrUndefined(this.guardianSignature),
            relayerSignature: this.toHexOrUndefined(this.relayerSignature),
        };

        return plainObject;
    }

    /**
     * Legacy method, use "Transaction.newFromPlainObject()" instead.
     * Converts a plain object transaction into a Transaction Object.
     *
     * @param plainObjectTransaction Raw data of a transaction, usually obtained by calling toPlainObject()
     */
    static fromPlainObject(plainObjectTransaction: IPlainTransactionObject): Transaction {
        return Transaction.newFromPlainObject(plainObjectTransaction);
    }

    /**
     * Converts a plain object transaction into a Transaction Object.
     *
     * @param plainObjectTransaction Raw data of a transaction, usually obtained by calling toPlainObject()
     */
    static newFromPlainObject(object: IPlainTransactionObject): Transaction {
        const transaction = new Transaction({
            nonce: BigInt(object.nonce),
            value: BigInt(object.value || ""),
            receiver: Address.newFromBech32(object.receiver),
            receiverUsername: Buffer.from(object.receiverUsername || "", "base64").toString(),
            sender: Address.newFromBech32(object.sender),
            senderUsername: Buffer.from(object.senderUsername || "", "base64").toString(),
            guardian: object.guardian ? Address.newFromBech32(object.guardian) : Address.empty(),
            relayer: object.relayer ? Address.newFromBech32(object.relayer) : Address.empty(),
            gasPrice: BigInt(object.gasPrice),
            gasLimit: BigInt(object.gasLimit),
            data: Buffer.from(object.data || "", "base64"),
            chainID: String(object.chainID),
            version: Number(object.version),
            options: object.options ? Number(object.options) : undefined,
            signature: Buffer.from(object.signature || "", "hex"),
            guardianSignature: Buffer.from(object.guardianSignature || "", "hex"),
            relayerSignature: Buffer.from(object.relayerSignature || "", "hex"),
        });

        return transaction;
    }

    /**
     * Legacy method, use the "signature" property instead.
     * Applies the signature on the transaction.
     *
     * @param signature The signature, as computed by a signer.
     */
    applySignature(signature: Uint8Array) {
        this.signature = interpretSignatureAsBuffer(signature);
    }

    /**
     * Legacy method, use the "guardianSignature" property instead.
     * Applies the guardian signature on the transaction.
     *
     * @param guardianSignature The signature, as computed by a signer.
     */
    applyGuardianSignature(guardianSignature: Uint8Array) {
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

    private toBase64OrUndefined(value?: string | Uint8Array) {
        return value && value.length ? Buffer.from(value).toString("base64") : undefined;
    }

    private toHexOrUndefined(value?: Uint8Array) {
        return value && value.length ? Buffer.from(value).toString("hex") : undefined;
    }
}
