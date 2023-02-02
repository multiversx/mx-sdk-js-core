import { CipherAlgorithm, Decryptor, EncryptedData, Encryptor, EncryptorVersion, KeyDerivationFunction, Randomness } from "./crypto";
import { ScryptKeyDerivationParams } from "./crypto/derivationParams";
import { Err } from "./errors";
import { UserPublicKey, UserSecretKey } from "./userKeys";

export enum UserWalletKind {
    SecretKey = "secretKey",
    Mnemonic = "mnemonic"
}

export class UserWallet {
    private readonly kind: UserWalletKind;
    private readonly encryptedData: EncryptedData;
    private readonly publicKeyWhenKindIsSecretKey?: UserPublicKey;

    private constructor({ kind, encryptedData, publicKeyWhenKindIsSecretKey }: {
        kind: UserWalletKind;
        encryptedData: EncryptedData;
        publicKeyWhenKindIsSecretKey?: UserPublicKey;
    }) {
        this.kind = kind;
        this.encryptedData = encryptedData;
        this.publicKeyWhenKindIsSecretKey = publicKeyWhenKindIsSecretKey;
    }

    static fromSecretKey({ secretKey, password, randomness }: {
        encryptorVersion?: EncryptorVersion;
        secretKey: UserSecretKey;
        password: string;
        randomness?: Randomness;
    }): UserWallet {
        randomness = randomness || new Randomness();

        const publicKey = secretKey.generatePublicKey();
        const text = Buffer.concat([secretKey.valueOf(), publicKey.valueOf()]);
        const encryptedData = Encryptor.encrypt(text, password, randomness);

        return new UserWallet({
            kind: UserWalletKind.SecretKey,
            encryptedData,
            publicKeyWhenKindIsSecretKey: publicKey
        });
    }

    static fromMnemonic({ mnemonic, password, randomness }: {
        mnemonic: string;
        password: string;
        randomness?: Randomness;
    }): UserWallet {
        randomness = randomness || new Randomness();

        const encryptedData = Encryptor.encrypt(Buffer.from(mnemonic), password, randomness);

        return new UserWallet({
            kind: UserWalletKind.Mnemonic,
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
        // Here, we do not check the "kind" field. Older keystore files holding secret keys do not have this field.

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
        if (keyFileObject.kind != UserWalletKind.Mnemonic) {
            throw new Err(`Expected kind to be ${UserWalletKind.Mnemonic}, but it was ${keyFileObject.kind}.`);
        }

        const encryptedData = UserWallet.edFromJSON(keyFileObject);
        const text = Decryptor.decrypt(encryptedData, password);
        return text.toString();
    }

    static edFromJSON(keyfileObject: any): EncryptedData {
        return new EncryptedData({
            version: keyfileObject.version,
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
            return this.toJSONWhenKindIsSecretKey();
        }

        return this.toJSONWhenKindIsMnemonic();
    }

    private toJSONWhenKindIsSecretKey(): any {
        if (!this.publicKeyWhenKindIsSecretKey) {
            throw new Err("Public key isn't available");
        }

        const cryptoSection = this.getCryptoSectionAsJSON();

        const envelope: any = {
            version: this.encryptedData.version,
            // Adding "kind", if appropriate.
            ...(this.kind ? { kind: this.kind } : {}),
            id: this.encryptedData.id,
            address: this.publicKeyWhenKindIsSecretKey.hex(),
            bech32: this.publicKeyWhenKindIsSecretKey.toAddress().toString(),
            crypto: cryptoSection
        };

        return envelope;
    }

    getCryptoSectionAsJSON(): any {
        const cryptoSection: any = {
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

    toJSONWhenKindIsMnemonic(): any {
        const cryptoSection = this.getCryptoSectionAsJSON();

        return {
            version: this.encryptedData.version,
            id: this.encryptedData.id,
            kind: this.kind,
            crypto: cryptoSection
        };
    }
}

