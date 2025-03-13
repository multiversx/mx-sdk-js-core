import * as fs from "fs";
import { PathLike } from "fs";
import { Address, IAccount, LibraryConfig, Message, MessageComputer, Transaction, TransactionComputer } from "../core";
import { KeyPair, Mnemonic, UserPem, UserPublicKey, UserSecretKey, UserSigner, UserWallet } from "../wallet";

/**
 * An abstraction representing an account (user or Smart Contract) on the Network.
 */
export class Account implements IAccount {
    /**
     * The address of the account.
     */
    readonly address: Address;

    /**
     * Local copy of the account nonce.
     * Must be explicitly managed by client code.
     */
    nonce: bigint = 0n;

    /**
     * The secret key of the account.
     */
    readonly secretKey: UserSecretKey;

    /**
     * The public key of the account.
     */
    readonly publicKey: UserPublicKey;

    /**
     * Creates an account object from a secret key
     */
    constructor(secretKey: UserSecretKey, hrp: string = LibraryConfig.DefaultAddressHrp) {
        this.secretKey = secretKey;
        this.publicKey = secretKey.generatePublicKey();
        this.address = this.publicKey.toAddress(hrp);
    }

    /**
     * Named constructor
     * Loads a secret key from a PEM file. PEM files may contain multiple accounts - thus, an (optional) "index" is used to select the desired secret key.
     * Returns an Account object, initialized with the secret key.
     */
    static async newFromPem(
        path: PathLike,
        index: number = 0,
        hrp: string = LibraryConfig.DefaultAddressHrp,
    ): Promise<Account> {
        const text = await fs.promises.readFile(path, { encoding: "utf8" });
        const userSigner = UserSigner.fromPem(text, index);
        return new Account(userSigner.secretKey, hrp);
    }

    /**
     * Named constructor
     * Loads a secret key from an encrypted keystore file. Handles both keystores that hold a mnemonic and ones that hold a secret key (legacy).
     * For keystores that hold an encrypted mnemonic, the optional "addressIndex" parameter is used to derive the desired secret key.
     * Returns an Account object, initialized with the secret key.
     */
    static newFromKeystore(
        filePath: string,
        password: string,
        addressIndex?: number,
        hrp: string = LibraryConfig.DefaultAddressHrp,
    ): Account {
        const secretKey = UserWallet.loadSecretKey(filePath, password, addressIndex);
        return new Account(secretKey, hrp);
    }

    /**
     * Named constructor
     * Loads (derives) a secret key from a mnemonic. The optional "addressIndex" parameter is used to guide the derivation.
     * Returns an Account object, initialized with the secret key.
     */
    static newFromMnemonic(
        mnemonic: string,
        addressIndex: number = 0,
        hrp: string = LibraryConfig.DefaultAddressHrp,
    ): Account {
        const mnemonicHandler = Mnemonic.fromString(mnemonic);
        const secretKey = mnemonicHandler.deriveKey(addressIndex);
        return new Account(secretKey, hrp);
    }
    /**
     * Named constructor
     * Returns an Account object, initialized with the secret key.
     */
    static newFromKeypair(keypair: KeyPair, hrp: string = LibraryConfig.DefaultAddressHrp): Account {
        return new Account(keypair.secretKey, hrp);
    }

    /**
     * Increments (locally) the nonce (the account sequence number).
     */
    incrementNonce() {
        this.nonce = this.nonce + 1n;
    }

    /**
     * Signs using the secret key of the account.
     */
    async sign(data: Uint8Array): Promise<Uint8Array> {
        return this.secretKey.sign(data);
    }

    /**
     * Verifies the signature using the public key of the account.
     */
    async verify(data: Uint8Array, signature: Uint8Array): Promise<boolean> {
        return this.publicKey.verify(data, signature);
    }

    /**
     * Serializes the transaction, computes the signature and returns it.
     */
    async signTransaction(transaction: Transaction): Promise<Uint8Array> {
        const transactionComputer = new TransactionComputer();
        const serializedTransaction = transactionComputer.computeBytesForSigning(transaction);
        return this.secretKey.sign(serializedTransaction);
    }

    /**
     * Verifies the transaction signature using the public key of the account.
     */
    async verifyTransactionSignature(transaction: Transaction, signature: Uint8Array): Promise<boolean> {
        const transactionComputer = new TransactionComputer();
        const serializedTransaction = transactionComputer.computeBytesForVerifying(transaction);
        return this.publicKey.verify(serializedTransaction, signature);
    }

    /**
     * Serializes the message, computes the signature and returns it.
     */
    async signMessage(message: Message): Promise<Uint8Array> {
        const messageComputer = new MessageComputer();
        const serializedMessage = messageComputer.computeBytesForSigning(message);
        return this.secretKey.sign(serializedMessage);
    }

    /**
     * Verifies the message signature using the public key of the account.
     */
    async verifyMessageSignature(message: Message, signature: Uint8Array): Promise<boolean> {
        const messageComputer = new MessageComputer();
        const serializedMessage = messageComputer.computeBytesForVerifying(message);
        return this.publicKey.verify(serializedMessage, signature);
    }

    /**
     * Gets the nonce (the one from the object's state) and increments it.
     */
    getNonceThenIncrement(): bigint {
        let nonce = this.nonce;
        this.nonce = this.nonce + 1n;
        return nonce;
    }

    /**
     * Saves the wallet to a pem file
     */
    saveToPem(path: string): void {
        const pem = new UserPem(this.address.toBech32(), this.secretKey);
        pem.save(path);
    }

    /**
     * Saves the wallet to a keystore file
     */
    saveToKeystore(path: PathLike, password: string): void {
        const wallet = UserWallet.fromSecretKey({ secretKey: this.secretKey, password });
        wallet.save(path, this.address.getHrp());
    }
}
