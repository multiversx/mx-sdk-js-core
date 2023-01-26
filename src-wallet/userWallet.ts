import { CipherAlgorithm, Decryptor, EncryptedData, Encryptor, EncryptorVersion, KeyDerivationFunction, Randomness } from "./crypto";
import { ScryptKeyDerivationParams } from "./crypto/derivationParams";
import { Err } from "./errors";
import { UserPublicKey, UserSecretKey } from "./userKeys";

export enum EnvelopeVersion {
    // Does not have the "kind" field, and is meant to hold the **secret key**.
    // The "crypto" section is not versioned.
    V4 = 4,
    // Has the "kind" field, and is meant to hold the **secret key** or **the mnemonic** (or any other secret payload).
    // Furthermore, the "crypto" section is versioned separately.
    V5 = 5
}

export enum UserWalletKind {
    SecretKey = "secretKey",
    Mnemonic = "mnemonic",
    Arbitrary = "arbitrary"
}

export class UserWallet {
    private readonly envelopeVersion: number;
    private readonly kind: UserWalletKind;
    private readonly encryptedData: EncryptedData;
    private readonly publicKeyWhenKindIsSecretKey?: UserPublicKey;

    private constructor({
        envelopeVersion: envelopeVersion,
        kind,
        encryptedData,
        publicKeyWhenKindIsSecretKey
    }: {
        envelopeVersion: EnvelopeVersion;
        kind: UserWalletKind;
        encryptedData: EncryptedData;
        publicKeyWhenKindIsSecretKey?: UserPublicKey;
    }) {
        this.envelopeVersion = envelopeVersion;
        this.kind = kind;
        this.encryptedData = encryptedData;
        this.publicKeyWhenKindIsSecretKey = publicKeyWhenKindIsSecretKey;
    }

    static fromSecretKey({
        envelopeVersion,
        encryptorVersion,
        secretKey,
        password,
        randomness,
    }: {
        envelopeVersion?: EnvelopeVersion;
        encryptorVersion?: EncryptorVersion;
        secretKey: UserSecretKey;
        password: string;
        randomness?: Randomness;
    }): UserWallet {
        envelopeVersion = envelopeVersion || EnvelopeVersion.V4;
        encryptorVersion = encryptorVersion || EncryptorVersion.V4;
        randomness = randomness || new Randomness();

        const publicKey = secretKey.generatePublicKey();
        const text = Buffer.concat([secretKey.valueOf(), publicKey.valueOf()]);
        const encryptedData = Encryptor.encrypt(encryptorVersion, text, password, randomness);

        return new UserWallet({
            envelopeVersion: envelopeVersion,
            kind: UserWalletKind.SecretKey,
            encryptedData,
            publicKeyWhenKindIsSecretKey: publicKey
        });
    }

    static fromMnemonic({
        envelopeVersion,
        encryptorVersion,
        mnemonic,
        password,
        randomness,
    }: {
        envelopeVersion?: EnvelopeVersion;
        encryptorVersion?: EncryptorVersion;
        mnemonic: string;
        password: string;
        randomness?: Randomness;
    }): UserWallet {
        envelopeVersion = envelopeVersion || EnvelopeVersion.V5;
        encryptorVersion = encryptorVersion || EncryptorVersion.V4;
        randomness = randomness || new Randomness();

        const encryptedData = Encryptor.encrypt(encryptorVersion, Buffer.from(mnemonic), password, randomness);

        return new UserWallet({
            envelopeVersion: envelopeVersion,
            kind: UserWalletKind.Mnemonic,
            encryptedData
        });
    }

    static fromArbitrary({
        envelopeVersion,
        encryptorVersion,
        arbitraryData,
        password,
        randomness,
    }: {
        envelopeVersion?: EnvelopeVersion;
        encryptorVersion?: EncryptorVersion;
        arbitraryData: Buffer;
        password: string;
        randomness?: Randomness;
    }): UserWallet {
        envelopeVersion = envelopeVersion || EnvelopeVersion.V5;
        encryptorVersion = encryptorVersion || EncryptorVersion.V4;
        randomness = randomness || new Randomness();

        const encryptedData = Encryptor.encrypt(encryptorVersion, arbitraryData, password, randomness);

        return new UserWallet({
            envelopeVersion: envelopeVersion,
            kind: UserWalletKind.Arbitrary,
            encryptedData
        });
    }

    /**
     * Copied from: https://github.com/multiversx/mx-deprecated-core-js/blob/v1.28.0/src/account.js#L42
     * Notes: adjustements (code refactoring, no change in logic), in terms of: 
     *  - typing (since this is the TypeScript version)
     *  - error handling (in line with sdk-core's error system)
     *  - references to crypto functions
     *  - references to object members
     * 
     * From an encrypted keyfile, given the password, loads the secret key and the public key.
     */
    static decryptSecretKey(keyFileObject: any, password: string): UserSecretKey {
        if (keyFileObject.version >= EnvelopeVersion.V5) {
            this.requireKind(keyFileObject.kind, UserWalletKind.SecretKey, "decryptSecretKey")
        }

        const encryptedData = UserWallet.edFromJSON(keyFileObject);

        let text = Decryptor.decrypt(encryptedData, password);
        while (text.length < 32) {
            let zeroPadding = Buffer.from([0x00]);
            text = Buffer.concat([zeroPadding, text]);
        }

        const seed = text.slice(0, 32);
        return new UserSecretKey(seed);
    }

    static decryptMnemonic(keyFileObject: any, password: string): string {
        this.requireV5OrHigher(keyFileObject.version, "decryptMnemonic");
        this.requireKind(keyFileObject.kind, UserWalletKind.Mnemonic, "decryptMnemonic")

        const encryptedData = UserWallet.edFromJSON(keyFileObject);
        const text = Decryptor.decrypt(encryptedData, password);
        return text.toString();
    }

    static decryptArbitrary(keyFileObject: any, password: string): Buffer {
        this.requireV5OrHigher(keyFileObject.version, "decryptArbitrary");
        this.requireKind(keyFileObject.kind, UserWalletKind.Arbitrary, "decryptArbitrary")

        const encryptedData = UserWallet.edFromJSON(keyFileObject);
        const data = Decryptor.decrypt(encryptedData, password);
        return data;
    }

    static edFromJSON(keyfileObject: any): EncryptedData {
        const encryptorVersion: number = (keyfileObject.version == EnvelopeVersion.V4) ?
            // In V4, the "crypto" section inherits the version from the envelope.
            EncryptorVersion.V4 :
            // In V5, the "crypto" section has its own version.
            keyfileObject.crypto.version;

        return new EncryptedData({
            version: encryptorVersion,
            id: keyfileObject.id,
            cipher: keyfileObject.crypto.cipher,
            ciphertext: keyfileObject.crypto.ciphertext,
            iv: keyfileObject.crypto.cipherparams.iv,
            kdf: keyfileObject.crypto.kdf,
            kdfparams: new ScryptKeyDerivationParams(
                keyfileObject.crypto.kdfparams.n,
                keyfileObject.crypto.kdfparams.r,
                keyfileObject.crypto.kdfparams.p,
                keyfileObject.crypto.kdfparams.dklen
            ),
            salt: keyfileObject.crypto.kdfparams.salt,
            mac: keyfileObject.crypto.mac,
        });
    }

    /**
     * Converts the encrypted keyfile to plain JavaScript object.
     */
    toJSON(): any {
        if (this.kind == UserWalletKind.SecretKey) {
            return this.getEnvelopeWhenKindIsSecretKey();
        }

        return this.getEnvelopeWhenKindIsMnemonicOrArbitrary();
    }

    getEnvelopeWhenKindIsSecretKey(): any {
        if (!this.publicKeyWhenKindIsSecretKey) {
            throw new Err("Public key isn't available");
        }

        const cryptoSection = this.getCryptoSectionAsJSON();

        const envelope: any = {
            version: this.envelopeVersion,
            // Adding "kind", if appropriate.
            ...(this.envelopeVersion >= 5 ? { kind: UserWalletKind.SecretKey } : {}),
            id: this.encryptedData.id,
            address: this.publicKeyWhenKindIsSecretKey.hex(),
            bech32: this.publicKeyWhenKindIsSecretKey.toAddress().toString(),
            crypto: cryptoSection
        };

        return envelope;
    }

    getCryptoSectionAsJSON(): any {
        const cryptoSection: any = {
            // Adding "version", if appropriate.
            ...(this.envelopeVersion >= 5 ? { version: this.encryptedData.version } : {}),
            ciphertext: this.encryptedData.ciphertext,
            cipherparams: { iv: this.encryptedData.iv },
            cipher: CipherAlgorithm,
            kdf: KeyDerivationFunction,
            kdfparams: {
                dklen: this.encryptedData.kdfparams.dklen,
                salt: this.encryptedData.salt,
                n: this.encryptedData.kdfparams.n,
                r: this.encryptedData.kdfparams.r,
                p: this.encryptedData.kdfparams.p
            },
            mac: this.encryptedData.mac,
        };

        return cryptoSection;
    }

    getEnvelopeWhenKindIsMnemonicOrArbitrary(): any {
        const cryptoSection = this.getCryptoSectionAsJSON();

        return {
            version: this.envelopeVersion,
            id: this.encryptedData.id,
            kind: this.kind,
            crypto: cryptoSection
        };
    }

    private static requireKind(kind: UserWalletKind, expectedKind: UserWalletKind, context: string) {
        if (kind != expectedKind) {
            throw new Err(`Expected kind to be ${expectedKind}, but it was ${kind}. Context: ${context}`);
        }
    }

    private static requireV5OrHigher(version: EnvelopeVersion, context: string) {
        if (version < EnvelopeVersion.V5) {
            throw new Err(`Unsupported version: ${version}. Context: ${context}`);
        }
    }
}
