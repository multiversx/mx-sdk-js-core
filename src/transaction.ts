import { BigNumber } from "bignumber.js";
import { Address } from "./address";
import { TRANSACTION_MIN_GAS_PRICE, TRANSACTION_OPTIONS_DEFAULT, TRANSACTION_VERSION_DEFAULT } from "./constants";
import * as errors from "./errors";
import { Hash } from "./hash";
import {
    IAddress,
    IChainID,
    IGasLimit,
    IGasPrice,
    INonce,
    IPlainTransactionObject,
    ISignature,
    ITransaction,
    ITransactionOptions,
    ITransactionPayload,
    ITransactionValue,
    ITransactionVersion,
} from "./interface";
import { INetworkConfig } from "./interfaceOfNetwork";
import { TransactionOptions, TransactionVersion } from "./networkParams";
import { ProtoSerializer } from "./proto";
import { Signature, interpretSignatureAsBuffer } from "./signature";
import { TransactionPayload } from "./transactionPayload";
import { guardNotEmpty } from "./utils";

const createTransactionHasher = require("blake2b");
const TRANSACTION_HASH_LENGTH = 32;

/**
 * An abstraction for creating, signing and broadcasting transactions.
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
     * The signature.
     */
    public signature: Uint8Array;

    /**
     * The signature of the guardian.
     */
    public guardianSignature: Uint8Array;

    /**
     * The transaction hash, also used as a transaction identifier.
     */
    private hash: TransactionHash;

    /**
     * Creates a new Transaction object.
     */
    public constructor({
        nonce,
        value,
        sender,
        receiver,
        senderUsername,
        receiverUsername,
        gasPrice,
        gasLimit,
        data,
        chainID,
        version,
        options,
        guardian,
        signature,
        guardianSignature,
    }: {
        nonce?: INonce | bigint;
        value?: ITransactionValue | bigint;
        sender?: IAddress | string;
        receiver?: IAddress | string;
        senderUsername?: string;
        receiverUsername?: string;
        gasPrice?: IGasPrice | bigint;
        gasLimit?: IGasLimit | bigint;
        data?: ITransactionPayload | Uint8Array;
        chainID?: IChainID | string;
        version?: ITransactionVersion | number;
        options?: ITransactionOptions | number;
        guardian?: IAddress | string;
        signature?: Uint8Array;
        guardianSignature?: Uint8Array;
    }) {
        this.nonce = BigInt(nonce?.valueOf() || 0n);
        // We still rely on "bigNumber" for value, because client code might be passing a BigNumber object as a legacy "ITransactionValue",
        // and we want to keep compatibility.
        this.value = value ? BigInt(new BigNumber(value.toString()).toFixed(0)) : 0n;
        this.sender = sender ? (typeof sender === "string" ? sender : sender.bech32()) : "";
        this.receiver = receiver ? (typeof receiver === "string" ? receiver : receiver.bech32()) : "";
        this.senderUsername = senderUsername || "";
        this.receiverUsername = receiverUsername || "";
        this.gasPrice = BigInt(gasPrice?.valueOf() || TRANSACTION_MIN_GAS_PRICE);
        this.gasLimit = BigInt(gasLimit?.valueOf() || 0n);
        this.data = data?.valueOf() || new Uint8Array();
        this.chainID = chainID?.valueOf() || "";
        this.version = version?.valueOf() || TRANSACTION_VERSION_DEFAULT;
        this.options = options?.valueOf() || TRANSACTION_OPTIONS_DEFAULT;
        this.guardian = guardian ? (typeof guardian === "string" ? guardian : guardian.bech32()) : "";

        this.signature = Buffer.from([]);
        this.guardianSignature = Buffer.from([]);
        this.hash = TransactionHash.empty();

        // Legacy logic, will be kept for some time, to avoid breaking changes in behavior.
        if (signature?.length) {
            this.applySignature(signature);
        }
        if (guardianSignature?.length) {
            this.applyGuardianSignature(guardianSignature);
        }
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
        guardNotEmpty(this.hash, "hash");
        return this.hash;
    }

    /**
     * Serializes a transaction to a sequence of bytes, ready to be signed.
     * This function is called internally by signers.
     */
    serializeForSigning(): Buffer {
        // TODO: for appropriate tx.version, interpret tx.options accordingly and sign using the content / data hash
        let plain = this.toPlainObject();
        // Make sure we never sign the transaction with another signature set up (useful when using the same method for verification)
        if (plain.signature) {
            delete plain.signature;
        }

        if (plain.guardianSignature) {
            delete plain.guardianSignature;
        }

        if (!plain.guardian) {
            delete plain.guardian;
        }

        let serialized = JSON.stringify(plain);

        return Buffer.from(serialized);
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
     * Legacy method, use the "converters" package instead.
     *
     * Converts the transaction object into a ready-to-serialize, plain JavaScript object.
     * This function is called internally within the signing procedure.
     */
    toPlainObject(): IPlainTransactionObject {
        const plainObject = {
            nonce: Number(this.nonce),
            value: this.value.toString(),
            receiver: this.receiver,
            sender: this.sender,
            senderUsername: this.senderUsername ? Buffer.from(this.senderUsername).toString("base64") : undefined,
            receiverUsername: this.receiverUsername ? Buffer.from(this.receiverUsername).toString("base64") : undefined,
            gasPrice: Number(this.gasPrice),
            gasLimit: Number(this.gasLimit),
            data: this.data.length == 0 ? undefined : Buffer.from(this.data).toString("base64"),
            chainID: this.chainID.valueOf(),
            version: this.getVersion().valueOf(),
            options: this.getOptions().valueOf() == 0 ? undefined : this.getOptions().valueOf(),
            guardian: this.guardian ? this.guardian : undefined,
            signature: this.signature.length ? this.getSignature().toString("hex") : undefined,
            guardianSignature: this.guardianSignature.length ? this.getGuardianSignature().toString("hex") : undefined,
        };

        return plainObject;
    }

    /**
     * Converts a plain object transaction into a Transaction Object.
     *
     * @param plainObjectTransaction Raw data of a transaction, usually obtained by calling toPlainObject()
     */
    static fromPlainObject(plainObjectTransaction: IPlainTransactionObject): Transaction {
        const tx = new Transaction({
            nonce: Number(plainObjectTransaction.nonce),
            value: new BigNumber(plainObjectTransaction.value).toFixed(0),
            receiver: plainObjectTransaction.receiver,
            receiverUsername: plainObjectTransaction.receiverUsername
                ? Buffer.from(plainObjectTransaction.receiverUsername, "base64").toString()
                : undefined,
            sender: plainObjectTransaction.sender,
            senderUsername: plainObjectTransaction.senderUsername
                ? Buffer.from(plainObjectTransaction.senderUsername, "base64").toString()
                : undefined,
            guardian: plainObjectTransaction.guardian ? Address.fromString(plainObjectTransaction.guardian) : undefined,
            gasPrice: Number(plainObjectTransaction.gasPrice),
            gasLimit: Number(plainObjectTransaction.gasLimit),
            data: new TransactionPayload(Buffer.from(plainObjectTransaction.data || "", "base64")),
            chainID: String(plainObjectTransaction.chainID),
            version: plainObjectTransaction.version,
            options:
                plainObjectTransaction.options != null
                    ? new TransactionOptions(plainObjectTransaction.options)
                    : undefined,
        });

        if (plainObjectTransaction.signature) {
            tx.applySignature(new Signature(plainObjectTransaction.signature));
        }

        if (plainObjectTransaction.guardianSignature) {
            tx.applyGuardianSignature(new Signature(plainObjectTransaction.guardianSignature));
        }

        return tx;
    }

    /**
     * Applies the signature on the transaction.
     *
     * @param signature The signature, as computed by a signer.
     */
    applySignature(signature: ISignature | Uint8Array) {
        this.signature = interpretSignatureAsBuffer(signature);
        this.hash = TransactionHash.compute(this);
    }

    /**
     * Applies the guardian signature on the transaction.
     *
     * @param guardianSignature The signature, as computed by a signer.
     */
    applyGuardianSignature(guardianSignature: ISignature | Uint8Array) {
        this.guardianSignature = interpretSignatureAsBuffer(guardianSignature);
        this.hash = TransactionHash.compute(this);
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
 * An abstraction for handling and computing transaction hashes.
 */
export class TransactionHash extends Hash {
    constructor(hash: string) {
        super(hash);
    }

    /**
     * Computes the hash of a transaction.
     */
    static compute(transaction: Transaction): TransactionHash {
        let serializer = new ProtoSerializer();
        let buffer = serializer.serializeTransaction(transaction);
        let hash = createTransactionHasher(TRANSACTION_HASH_LENGTH).update(buffer).digest("hex");
        return new TransactionHash(hash);
    }
}

/**
 * An utilitary class meant to work together with the {@link Transaction} class.
 */
export class TransactionComputer {
    constructor() {}

    computeTransactionFee(
        transaction: { gasPrice: bigint; gasLimit: bigint; data: Uint8Array },
        networkConfig: INetworkConfig,
    ): bigint {
        const moveBalanceGas = BigInt(
            networkConfig.MinGasLimit + transaction.data.length * networkConfig.GasPerDataByte,
        );
        if (moveBalanceGas > transaction.gasLimit) {
            throw new errors.ErrNotEnoughGas(parseInt(transaction.gasLimit.toString(), 10));
        }

        const gasPrice = transaction.gasPrice;
        const feeForMove = moveBalanceGas * gasPrice;
        if (moveBalanceGas === transaction.gasLimit) {
            return feeForMove;
        }

        const diff = transaction.gasLimit - moveBalanceGas;
        const modifiedGasPrice = BigInt(
            new BigNumber(gasPrice.toString()).multipliedBy(new BigNumber(networkConfig.GasPriceModifier)).toFixed(0),
        );
        const processingFee = diff * modifiedGasPrice;

        return feeForMove + processingFee;
    }

    computeBytesForSigning(transaction: ITransaction): Uint8Array {
        // TODO: do some checks for the transaction e.g. sender, chain ID etc.

        const plainTransaction = this.toPlainObject(transaction);

        if (plainTransaction.signature) {
            delete plainTransaction.signature;
        }

        if (plainTransaction.guardianSignature) {
            delete plainTransaction.guardianSignature;
        }

        if (!plainTransaction.guardian) {
            delete plainTransaction.guardian;
        }

        const serialized = JSON.stringify(plainTransaction);

        return new Uint8Array(Buffer.from(serialized));
    }

    computeTransactionHash(transaction: ITransaction): Uint8Array {
        let serializer = new ProtoSerializer();

        const buffer = serializer.serializeTransaction(new Transaction(transaction));
        const hash = createTransactionHasher(TRANSACTION_HASH_LENGTH).update(buffer).digest("hex");

        return Buffer.from(hash, "hex");
    }

    private toPlainObject(transaction: ITransaction) {
        return {
            nonce: Number(transaction.nonce),
            value: transaction.value.toString(),
            receiver: transaction.receiver,
            sender: transaction.sender,
            senderUsername: transaction.senderUsername
                ? Buffer.from(transaction.senderUsername).toString("base64")
                : undefined,
            receiverUsername: transaction.receiverUsername
                ? Buffer.from(transaction.receiverUsername).toString("base64")
                : undefined,
            gasPrice: Number(transaction.gasPrice),
            gasLimit: Number(transaction.gasLimit),
            data:
                transaction.data && transaction.data.length === 0
                    ? undefined
                    : Buffer.from(transaction.data).toString("base64"),
            chainID: transaction.chainID,
            version: transaction.version,
            options: transaction.options ? transaction.options : undefined,
            guardian: transaction.guardian ? transaction.guardian : undefined,
            signature:
                transaction.signature.length == 0 ? undefined : Buffer.from(transaction.signature).toString("hex"),
            guardianSignature:
                transaction.guardianSignature.length == 0
                    ? undefined
                    : Buffer.from(transaction.guardianSignature).toString("hex"),
        };
    }

    // TODO: missing functions from specs, with setting options etc.?
}
