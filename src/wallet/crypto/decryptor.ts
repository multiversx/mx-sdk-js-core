import crypto from "crypto";
import { Err } from "../../core/errors";
import { DigestAlgorithm } from "./constants";
import { EncryptedData } from "./encryptedData";

export class Decryptor {
    static decrypt(data: EncryptedData, password: string): Buffer {
        const kdfparams = data.kdfparams;
        const salt = Buffer.from(data.salt, "hex");
        const iv = Buffer.from(data.iv, "hex");
        const ciphertext = Buffer.from(data.ciphertext, "hex");
        const derivedKey = kdfparams.generateDerivedKey(Buffer.from(password), salt);
        const derivedKeyFirstHalf = derivedKey.slice(0, 16);
        const derivedKeySecondHalf = derivedKey.slice(16, 32);

        const computedMAC = crypto.createHmac(DigestAlgorithm, derivedKeySecondHalf).update(ciphertext).digest();
        const actualMAC = data.mac;

        if (computedMAC.toString("hex") !== actualMAC) {
            throw new Err("MAC mismatch, possibly wrong password");
        }

        const decipher = crypto.createDecipheriv(data.cipher, derivedKeyFirstHalf, iv);

        return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    }
}
