import { PathLike, readFileSync, writeFileSync } from "fs";
import path, { isAbsolute, join, resolve } from "path";
import { LibraryConfig } from "../core/config";
import { Err } from "../core/errors";
import { Logger } from "../core/logger";
import { CipherAlgorithm, Decryptor, EncryptedData, Encryptor, KeyDerivationFunction, Randomness } from "./crypto";
import { ScryptKeyDerivationParams } from "./crypto/derivationParams";
import { Mnemonic } from "./mnemonic";
import { UserPublicKey, UserSecretKey } from "./userKeys";

interface IRandomness {
    id: string;
    iv: Buffer;
    salt: Buffer;
}

export enum UserWalletKind {
    SecretKey = "secretKey",
    Mnemonic = "mnemonic",
}

export class UserWallet {
    private readonly kind: UserWalletKind;
    private readonly encryptedData: EncryptedData;
    private readonly publicKeyWhenKindIsSecretKey?: UserPublicKey;

    private constructor({
        kind,
        encryptedData,
        publicKeyWhenKindIsSecretKey,
    }: {
        kind: UserWalletKind;
        encryptedData: EncryptedData;
        publicKeyWhenKindIsSecretKey?: UserPublicKey;
    }) {
        this.kind = kind;
        this.encryptedData = encryptedData;
        this.publicKeyWhenKindIsSecretKey = publicKeyWhenKindIsSecretKey;
    }

    static fromSecretKey({
        secretKey,
        password,
        randomness,
    }: {
        secretKey: UserSecretKey;
        password: string;
        randomness?: IRandomness;
    }): UserWallet {
        randomness = randomness || new Randomness();

        const publicKey = secretKey.generatePublicKey();
        const data = Buffer.concat([secretKey.valueOf(), publicKey.valueOf()]);
        const encryptedData = Encryptor.encrypt(data, password, randomness);

        return new UserWallet({
            kind: UserWalletKind.SecretKey,
            encryptedData,
            publicKeyWhenKindIsSecretKey: publicKey,
        });
    }

    static fromMnemonic({
        mnemonic,
        password,
        randomness,
    }: {
        mnemonic: string;
        password: string;
        randomness?: IRandomness;
    }): UserWallet {
        randomness = randomness || new Randomness();

        Mnemonic.assertTextIsValid(mnemonic);
        const data = Buffer.from(mnemonic);
        const encryptedData = Encryptor.encrypt(data, password, randomness);

        return new UserWallet({
            kind: UserWalletKind.Mnemonic,
            encryptedData,
        });
    }

    static loadSecretKey(filePath: string, password: string, addressIndex?: number): UserSecretKey {
        // Load and parse the keystore file
        const keyFileJson = readFileSync(path.resolve(filePath), "utf8");
        const keyFileObject = JSON.parse(keyFileJson);
        const kind = keyFileObject.kind || UserWalletKind.SecretKey.valueOf();

        Logger.debug(`UserWallet.loadSecretKey(), kind = ${kind}`);

        let secretKey: UserSecretKey;

        if (kind === UserWalletKind.SecretKey.valueOf()) {
            if (addressIndex !== undefined) {
                throw new Error("address_index must not be provided when kind == 'secretKey'");
            }
            secretKey = UserWallet.decryptSecretKey(keyFileObject, password);
        } else if (kind === UserWalletKind.Mnemonic.valueOf()) {
            const mnemonic = UserWallet.decryptMnemonic(keyFileObject, password);
            secretKey = mnemonic.deriveKey(addressIndex || 0);
        } else {
            throw new Error(`Unknown kind: ${kind}`);
        }

        return secretKey;
    }

    static decrypt(keyFileObject: any, password: string, addressIndex?: number): UserSecretKey {
        const kind = keyFileObject.kind || UserWalletKind.SecretKey;

        if (kind == UserWalletKind.SecretKey) {
            if (addressIndex !== undefined) {
                throw new Err("addressIndex must not be provided when kind == 'secretKey'");
            }

            return UserWallet.decryptSecretKey(keyFileObject, password);
        }

        if (kind == UserWalletKind.Mnemonic) {
            const mnemonic = this.decryptMnemonic(keyFileObject, password);
            return mnemonic.deriveKey(addressIndex || 0);
        }

        throw new Err(`Unknown kind: ${kind}`);
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
        // Here, we check the "kind" field only for files that have it. Older keystore files (holding only secret keys) do not have this field.
        const kind = keyFileObject.kind;
        if (kind && kind !== UserWalletKind.SecretKey) {
            throw new Err(`Expected keystore kind to be ${UserWalletKind.SecretKey}, but it was ${kind}.`);
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

    static decryptMnemonic(keyFileObject: any, password: string): Mnemonic {
        if (keyFileObject.kind != UserWalletKind.Mnemonic) {
            throw new Err(`Expected keystore kind to be ${UserWalletKind.Mnemonic}, but it was ${keyFileObject.kind}.`);
        }

        const encryptedData = UserWallet.edFromJSON(keyFileObject);
        const data = Decryptor.decrypt(encryptedData, password);
        const mnemonic = Mnemonic.fromString(data.toString());
        return mnemonic;
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
                keyfileObject.crypto.kdfparams.dklen,
            ),
            salt: keyfileObject.crypto.kdfparams.salt,
            mac: keyfileObject.crypto.mac,
        });
    }

    /**
     * Converts the encrypted keyfile to plain JavaScript object.
     */
    toJSON(addressHrp?: string): any {
        if (this.kind == UserWalletKind.SecretKey) {
            return this.toJSONWhenKindIsSecretKey(addressHrp);
        }

        return this.toJSONWhenKindIsMnemonic();
    }

    private toJSONWhenKindIsSecretKey(addressHrp?: string): any {
        if (!this.publicKeyWhenKindIsSecretKey) {
            throw new Err("Public key isn't available");
        }

        const cryptoSection = this.getCryptoSectionAsJSON();

        const envelope: any = {
            version: this.encryptedData.version,
            kind: this.kind,
            id: this.encryptedData.id,
            address: this.publicKeyWhenKindIsSecretKey.hex(),
            bech32: this.publicKeyWhenKindIsSecretKey.toAddress(addressHrp).toString(),
            crypto: cryptoSection,
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
                p: this.encryptedData.kdfparams.p,
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
            crypto: cryptoSection,
        };
    }

    save(path: PathLike, addressHrp: string = LibraryConfig.DefaultAddressHrp): void {
        const resolvedPath = isAbsolute(path.toString())
            ? resolve(path.toString())
            : resolve(join(process.cwd(), path.toString()));

        const jsonContent = this.toJSON(addressHrp);
        writeFileSync(resolvedPath, JSON.stringify(jsonContent, null, 4), { encoding: "utf-8" });
    }
}
