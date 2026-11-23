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

        // Bound the work requested by the keystore before deriving the MAC key.
        const { n, r, p, dklen } = kdfparams;
        if (![n, r, p, dklen].every(Number.isInteger)) {
            throw new ErrBadKeystore("scrypt parameters must be integers");
        }
        if (n < 2 || n > 2 ** 18 || (n & (n - 1)) !== 0) {
            throw new ErrBadKeystore(`unsupported scrypt parameter: n = ${n}`);
        }
        if (r < 1 || r > 8) {
            throw new ErrBadKeystore(`unsupported scrypt parameter: r = ${r}`);
        }
        if (p < 1 || p > 4) {
            throw new ErrBadKeystore(`unsupported scrypt parameter: p = ${p}`);
        }

        // A shorter derived key would shorten (or empty) the MAC key, so that a wrong password would go undetected.
        if (dklen !== DerivedKeyLength) {
            throw new ErrBadKeystore(`unsupported scrypt parameter: dklen = ${dklen}`);
        }

        if (typeof data.salt !== "string" || typeof data.iv !== "string" || typeof data.ciphertext !== "string") {
            throw new ErrBadKeystore("salt, IV and ciphertext must be hex strings");
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
