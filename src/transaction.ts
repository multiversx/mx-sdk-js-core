import { BigNumber } from "bignumber.js";
import { Address } from "./address";
import { Compatibility } from "./compatibility";
import { TRANSACTION_MIN_GAS_PRICE, TRANSACTION_OPTIONS_DEFAULT, TRANSACTION_VERSION_DEFAULT } from "./constants";
import * as errors from "./errors";
import { Hash } from "./hash";
import { IAddress, IChainID, IGasLimit, IGasPrice, INonce, IPlainTransactionObject, ISignature, ITransactionNext, ITransactionOptions, ITransactionPayload, ITransactionValue, ITransactionVersion } from "./interface";
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
  private nonce: INonce;

  /**
   * The value to transfer.
   */
  private value: ITransactionValue;

  /**
   * The address of the sender.
   */
  private sender: IAddress;

  /**
   * The address of the receiver.
   */
  private readonly receiver: IAddress;

  /**
   * The username of the sender.
   */
  private senderUsername: string;

  /** 
   * The username of the receiver.
   */
  private receiverUsername: string;

  /**
   * The gas price to be used.
   */
  private gasPrice: IGasPrice;

  /**
   * The maximum amount of gas to be consumed when processing the transaction.
   */
  private gasLimit: IGasLimit;

  /**
   * The payload of the transaction.
   */
  private readonly data: ITransactionPayload;

  /**
   * The chain ID of the Network (e.g. "1" for Mainnet).
   */
  private chainID: IChainID;

  /**
   * The version, required by the Network in order to correctly interpret the contents of the transaction.
   * @deprecated Use getVersion() and setVersion() instead.
   */
  version: TransactionVersion;

  /**
   * The options field, useful for describing different settings available for transactions
   * @deprecated Use getOptions() and setOptions() instead.
   */
  options: TransactionOptions;

  /**
   * The address of the guardian.
   */
  private guardian: IAddress;

  /**
   * The signature.
   */
  private signature: Buffer;

  /**
   * The signature of the guardian.
   */
  private guardianSignature: Buffer;

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
  }: {
    nonce?: INonce;
    value?: ITransactionValue;
    sender: IAddress;
    receiver: IAddress;
    senderUsername?: string;
    receiverUsername?: string;
    gasPrice?: IGasPrice;
    gasLimit: IGasLimit;
    data?: ITransactionPayload;
    chainID: IChainID;
    version?: ITransactionVersion;
    options?: ITransactionOptions;
    guardian?: IAddress;
  }) {
    this.nonce = nonce || 0;
    this.value = value ? new BigNumber(value.toString()).toFixed(0) : 0;
    this.sender = sender;
    this.receiver = receiver;
    this.senderUsername = senderUsername || "";
    this.receiverUsername = receiverUsername || "";
    this.gasPrice = gasPrice || TRANSACTION_MIN_GAS_PRICE;
    this.gasLimit = gasLimit;
    this.data = data || new TransactionPayload();
    this.chainID = chainID;
    this.version = version ? new TransactionVersion(version.valueOf()) : TransactionVersion.withDefaultVersion();
    this.options = options ? new TransactionOptions(options.valueOf()) : TransactionOptions.withDefaultOptions();
    this.guardian = guardian || Address.empty();

    this.signature = Buffer.from([]);
    this.guardianSignature = Buffer.from([]);
    this.hash = TransactionHash.empty();
  }

  getNonce(): INonce {
    return this.nonce;
  }

  /**
   * Sets the account sequence number of the sender. Must be done prior signing.
   */
  setNonce(nonce: INonce) {
    this.nonce = nonce;
  }

  getValue(): ITransactionValue {
    return this.value;
  }

  setValue(value: ITransactionValue) {
    this.value = value;
  }

  getSender(): IAddress {
    return this.sender;
  }

  setSender(sender: IAddress) {
    this.sender = sender;
  }

  getReceiver(): IAddress {
    return this.receiver;
  }

  getSenderUsername(): string {
    return this.senderUsername;
  }

  setSenderUsername(senderUsername: string) {
    this.senderUsername = senderUsername;
  }

  getReceiverUsername(): string {
    return this.receiverUsername;
  }

  setReceiverUsername(receiverUsername: string) {
    this.receiverUsername = receiverUsername;
  }

  getGuardian(): IAddress {
    return this.guardian;
  }

  getGasPrice(): IGasPrice {
    return this.gasPrice;
  }

  setGasPrice(gasPrice: IGasPrice) {
    this.gasPrice = gasPrice;
  }

  getGasLimit(): IGasLimit {
    return this.gasLimit;
  }

  setGasLimit(gasLimit: IGasLimit) {
    this.gasLimit = gasLimit;
  }

  getData(): ITransactionPayload {
    return this.data;
  }

  getChainID(): IChainID {
    return this.chainID;
  }

  setChainID(chainID: IChainID) {
    this.chainID = chainID;
  }

  getVersion(): TransactionVersion {
    return this.version;
  }

  setVersion(version: ITransactionVersion) {
    this.version = new TransactionVersion(version.valueOf());
  }

  getOptions(): TransactionOptions {
    // Make sure that "sdk-core v12" is compatible (for a while) with (older) libraries that were previously setting the (soon to be private) "options" field directly,
    // instead of using the "setOptions()" method.
    const options = new TransactionOptions(this.options.valueOf());
    return options;
  }

  setOptions(options: ITransactionOptions) {
    this.options = new TransactionOptions(options.valueOf());
  }

  getSignature(): Buffer {
    return this.signature;
  }

  getGuardianSignature(): Buffer {
    return this.guardianSignature;
  }

  setGuardian(guardian: IAddress) {
    this.guardian = guardian;
  }

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
      delete plain.guardian
    }

    let serialized = JSON.stringify(plain);

    return Buffer.from(serialized);
  }

  /**
   * Checks the integrity of the guarded transaction
   */
  isGuardedTransaction(): boolean {
    const hasGuardian = this.guardian.bech32().length > 0;
    const hasGuardianSignature = this.guardianSignature.length > 0;
    return this.getOptions().isWithGuardian() && hasGuardian && hasGuardianSignature;
  }

  /**
   * Converts the transaction object into a ready-to-serialize, plain JavaScript object.
   * This function is called internally within the signing procedure.
   */
  toPlainObject(): IPlainTransactionObject {
    const plainObject = {
      nonce: this.nonce.valueOf(),
      value: this.value.toString(),
      receiver: this.receiver.bech32(),
      sender: this.sender.bech32(),
      senderUsername: this.senderUsername ? Buffer.from(this.senderUsername).toString("base64") : undefined,
      receiverUsername: this.receiverUsername ? Buffer.from(this.receiverUsername).toString("base64") : undefined,
      gasPrice: this.gasPrice.valueOf(),
      gasLimit: this.gasLimit.valueOf(),
      data: this.data.length() == 0 ? undefined : this.data.encoded(),
      chainID: this.chainID.valueOf(),
      version: this.getVersion().valueOf(),
      options: this.getOptions().valueOf() == 0 ? undefined : this.getOptions().valueOf(),
      guardian: this.guardian?.bech32() ? (this.guardian.bech32() == "" ? undefined : this.guardian.bech32()) : undefined,
      signature: this.signature.toString("hex") ? this.signature.toString("hex") : undefined,
      guardianSignature: this.guardianSignature.toString("hex") ? this.guardianSignature.toString("hex") : undefined,
    };

    Compatibility.guardAddressIsSetAndNonZero(new Address(plainObject.sender), "'sender' of transaction", "pass the actual sender to the Transaction constructor")

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
      receiver: Address.fromString(plainObjectTransaction.receiver),
      receiverUsername: plainObjectTransaction.receiverUsername ? Buffer.from(plainObjectTransaction.receiverUsername, "base64").toString() : undefined,
      sender: Address.fromString(plainObjectTransaction.sender),
      senderUsername: plainObjectTransaction.senderUsername ? Buffer.from(plainObjectTransaction.senderUsername, "base64").toString() : undefined,
      guardian: plainObjectTransaction.guardian ? Address.fromString(plainObjectTransaction.guardian) : undefined,
      gasPrice: Number(plainObjectTransaction.gasPrice),
      gasLimit: Number(plainObjectTransaction.gasLimit),
      data: new TransactionPayload(Buffer.from(plainObjectTransaction.data || "", "base64")),
      chainID: String(plainObjectTransaction.chainID),
      version: new TransactionVersion(plainObjectTransaction.version),
      options: plainObjectTransaction.options != null ? new TransactionOptions(plainObjectTransaction.options) : undefined
    });

    if (plainObjectTransaction.signature) {
      tx.applySignature(
        new Signature(plainObjectTransaction.signature),
      );
    }

    if (plainObjectTransaction.guardianSignature) {
      tx.applyGuardianSignature(
        new Signature(plainObjectTransaction.guardianSignature)
      );
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
   * Computes the current transaction fee based on the {@link NetworkConfig} and transaction properties
   * @param networkConfig {@link NetworkConfig}
   */
  computeFee(networkConfig: INetworkConfig): BigNumber {
    let moveBalanceGas =
      networkConfig.MinGasLimit.valueOf() +
      this.data.length() * networkConfig.GasPerDataByte.valueOf();
    if (moveBalanceGas > this.gasLimit.valueOf()) {
      throw new errors.ErrNotEnoughGas(this.gasLimit.valueOf());
    }

    let gasPrice = new BigNumber(this.gasPrice.valueOf());
    let feeForMove = new BigNumber(moveBalanceGas).multipliedBy(gasPrice);
    if (moveBalanceGas === this.gasLimit.valueOf()) {
      return feeForMove;
    }

    let diff = new BigNumber(this.gasLimit.valueOf() - moveBalanceGas);
    let modifiedGasPrice = gasPrice.multipliedBy(
      new BigNumber(networkConfig.GasPriceModifier.valueOf())
    );
    let processingFee = diff.multipliedBy(modifiedGasPrice);

    return feeForMove.plus(processingFee);
  }

  /**
   * Creates a new Transaction object from a TransactionNext object.
   */
  static fromTransactionNext(transaction: ITransactionNext): Transaction {
    const tx = new Transaction({
      sender: Address.fromBech32(transaction.sender),
      receiver: Address.fromBech32(transaction.receiver),
      gasLimit: Number(transaction.gasLimit),
      chainID: transaction.chainID,
      value: new BigNumber(transaction.value.toString()).toFixed(0),
      data: new TransactionPayload(Buffer.from(transaction.data)),
      nonce: Number(transaction.nonce),
      gasPrice: Number(transaction.gasPrice),
      receiverUsername: transaction.receiverUsername,
      senderUsername: transaction.senderUsername,
      options: transaction.options,
      version: transaction.version
    });

    if (transaction.guardian) {
      tx.guardian = Address.fromBech32(transaction.guardian)
    }

    if (transaction.signature.length) {
      tx.applySignature(transaction.signature);
    }

    if (transaction.guardianSignature.length) {
      tx.applyGuardianSignature(transaction.guardianSignature);
    }

    return tx;
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
    let hash = createTransactionHasher(TRANSACTION_HASH_LENGTH)
      .update(buffer)
      .digest("hex");
    return new TransactionHash(hash);
  }
}

/**
 * An abstraction for creating, signing and broadcasting transactions.
 * Will replace the {@link Transaction} class in the future.
 */
export class TransactionNext {
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
  public sender: string;

  /**
   * The address of the receiver.
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
   * The options field of the transactions.
   */
  public options: number;

  /**
   * The address of the guardian.
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
   * Creates a new Transaction object.
   */
    public constructor(init: Partial<TransactionNext>) {
      this.nonce = 0n;
      this.value = 0n;
      this.sender = "";
      this.receiver = "";
      this.senderUsername = "";
      this.receiverUsername = "";
      this.gasPrice = BigInt(TRANSACTION_MIN_GAS_PRICE);
      this.gasLimit = 0n;
      this.data = new Uint8Array();
      this.chainID = "";
      this.version = TRANSACTION_VERSION_DEFAULT;
      this.options = TRANSACTION_OPTIONS_DEFAULT;
      this.guardian = "";
  
      this.signature = new Uint8Array();
      this.guardianSignature = new Uint8Array();

      Object.assign(this, init);
    }
}

/**
 * An utilitary class meant to work together with the {@link TransactionNext} class.
 */
export class TransactionComputer {
  constructor() { }

  computeTransactionFee(transaction: ITransactionNext, networkConfig: INetworkConfig): bigint {
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

  computeBytesForSigning(transaction: ITransactionNext): Uint8Array {
    const plainTransaction = this.toPlainObject(transaction);

    if (plainTransaction.signature) {
      delete plainTransaction.signature;
    }

    if (plainTransaction.guardianSignature) {
      delete plainTransaction.guardianSignature;
    }

    if (!plainTransaction.guardian) {
      delete plainTransaction.guardian
    }

    const serialized = JSON.stringify(plainTransaction);

    return new Uint8Array(Buffer.from(serialized));
  }

  computeTransactionHash(transaction: ITransactionNext): Uint8Array {
    let serializer = new ProtoSerializer();

    const tx = Transaction.fromTransactionNext(transaction);
    const buffer = serializer.serializeTransaction(tx);
    const hash = createTransactionHasher(TRANSACTION_HASH_LENGTH)
      .update(buffer)
      .digest("hex");

    return Buffer.from(hash, "hex");
  }

  private toPlainObject(transaction: ITransactionNext) {
    return {
      nonce: Number(transaction.nonce),
      value: transaction.value.toString(),
      receiver: transaction.receiver,
      sender: transaction.sender,
      senderUsername: transaction.senderUsername ? Buffer.from(transaction.senderUsername).toString("base64") : undefined,
      receiverUsername: transaction.receiverUsername ? Buffer.from(transaction.receiverUsername).toString("base64") : undefined,
      gasPrice: Number(transaction.gasPrice),
      gasLimit: Number(transaction.gasLimit),
      data: transaction.data && transaction.data.length === 0 ? undefined : Buffer.from(transaction.data).toString("base64"),
      chainID: transaction.chainID,
      version: transaction.version,
      options: transaction.options ? transaction.options : undefined,
      guardian: transaction.guardian ? transaction.guardian : undefined,
      signature: transaction.signature.length == 0 ? undefined : Buffer.from(transaction.signature).toString("hex"),
      guardianSignature: transaction.guardianSignature.length == 0 ? undefined : Buffer.from(transaction.guardianSignature).toString("hex")
    }
  }
}
