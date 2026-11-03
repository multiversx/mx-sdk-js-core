import crypto from "crypto";
import { Err, ErrBadKeystore } from "../../core/errors";
import { CipherAlgorithm, DerivedKeyLength, DigestAlgorithm, IVLength, KeyDerivationFunction } from "./constants";
import { EncryptedData } from "./encryptedData";

export class Decryptor {
    static decrypt(data: EncryptedData, password: string): Buffer {
        const kdfparams = data.kdfparams;

        if (data.kdf !== KeyDerivationFunction) {
            throw new ErrBadKeystore(`unsupported key derivation function: ${data.kdf}`);
        }

        // The cipher name comes from the (possibly untrusted) file, thus it must not reach "createDecipheriv".
        if (data.cipher !== CipherAlgorithm) {
            throw new ErrBadKeystore(`unsupported cipher: ${data.cipher}`);
        }

        // A shorter derived key would shorten (or empty) the MAC key, so that a wrong password would go undetected.
        if (kdfparams.dklen !== DerivedKeyLength) {
            throw new ErrBadKeystore(`unsupported scrypt parameter: dklen = ${kdfparams.dklen}`);
        }

        const salt = Buffer.from(data.salt, "hex");
        const iv = Buffer.from(data.iv, "hex");
        const ciphertext = Buffer.from(data.ciphertext, "hex");

        if (iv.length !== IVLength) {
            throw new ErrBadKeystore(`unexpected length of IV: ${iv.length}`);
        }

        const derivedKey = kdfparams.generateDerivedKey(Buffer.from(password), salt);
        const derivedKeyFirstHalf = derivedKey.slice(0, 16);
        const derivedKeySecondHalf = derivedKey.slice(16, 32);

        const computedMAC = crypto.createHmac(DigestAlgorithm, derivedKeySecondHalf).update(ciphertext).digest();
        const actualMAC = data.mac;

        if (computedMAC.toString("hex") !== actualMAC) {
            throw new Err("MAC mismatch, possibly wrong password");
        }

        const decipher = crypto.createDecipheriv(CipherAlgorithm, derivedKeyFirstHalf, iv);

        return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    }
}
