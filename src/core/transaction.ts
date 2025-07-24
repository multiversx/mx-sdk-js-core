import { Address } from "./address";
import { TRANSACTION_MIN_GAS_PRICE, TRANSACTION_OPTIONS_DEFAULT, TRANSACTION_VERSION_DEFAULT } from "./constants";
import { IPlainTransactionObject } from "./interfaces";
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
     * Converts a plain object transaction into a Transaction Object.
     *
     * @param plainObjectTransaction Raw data of a transaction, usually obtained by calling toPlainObject()
     */
    static newFromPlainObject(plainObjectTransaction: IPlainTransactionObject): Transaction {
        const transaction = new Transaction({
            nonce: BigInt(plainObjectTransaction.nonce),
            value: BigInt(plainObjectTransaction.value || ""),
            receiver: Address.newFromBech32(plainObjectTransaction.receiver),
            receiverUsername: Buffer.from(plainObjectTransaction.receiverUsername || "", "base64").toString(),
            sender: Address.newFromBech32(plainObjectTransaction.sender),
            senderUsername: Buffer.from(plainObjectTransaction.senderUsername || "", "base64").toString(),
            guardian: plainObjectTransaction.guardian
                ? Address.newFromBech32(plainObjectTransaction.guardian)
                : Address.empty(),
            relayer: plainObjectTransaction.relayer
                ? Address.newFromBech32(plainObjectTransaction.relayer)
                : Address.empty(),
            gasPrice: BigInt(plainObjectTransaction.gasPrice),
            gasLimit: BigInt(plainObjectTransaction.gasLimit),
            data: Buffer.from(plainObjectTransaction.data || "", "base64"),
            chainID: String(plainObjectTransaction.chainID),
            version: Number(plainObjectTransaction.version),
            options: plainObjectTransaction.options ? Number(plainObjectTransaction.options) : undefined,
            signature: Buffer.from(plainObjectTransaction.signature || "", "hex"),
            guardianSignature: Buffer.from(plainObjectTransaction.guardianSignature || "", "hex"),
            relayerSignature: Buffer.from(plainObjectTransaction.relayerSignature || "", "hex"),
        });

        return transaction;
    }

    /**
     * Converts a transaction to a ready-to-broadcast object.
     * Called internally by the network provider.
     */
    toSendable(): any {
        return this.toPlainObject();
    }

    private toBase64OrUndefined(value?: string | Uint8Array) {
        return value && value.length ? Buffer.from(value).toString("base64") : undefined;
    }

    private toHexOrUndefined(value?: Uint8Array) {
        return value && value.length ? Buffer.from(value).toString("hex") : undefined;
    }
}
