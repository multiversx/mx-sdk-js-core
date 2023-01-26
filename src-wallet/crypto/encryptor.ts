import crypto from "crypto";
import { CipherAlgorithm, DigestAlgorithm, KeyDerivationFunction } from "./constants";
import { ScryptKeyDerivationParams } from "./derivationParams";
import { EncryptedData } from "./encryptedData";
import { Randomness } from "./randomness";

export enum EncryptorVersion {
  V4 = 4,
}

export class Encryptor {
  static encrypt(version: EncryptorVersion, data: Buffer, password: string, randomness: Randomness = new Randomness()): EncryptedData {
    const kdParams = new ScryptKeyDerivationParams();
    const derivedKey = kdParams.generateDerivedKey(Buffer.from(password), randomness.salt);
    const derivedKeyFirstHalf = derivedKey.slice(0, 16);
    const derivedKeySecondHalf = derivedKey.slice(16, 32);
    const cipher = crypto.createCipheriv(CipherAlgorithm, derivedKeyFirstHalf, randomness.iv);

    const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);
    const mac = crypto.createHmac(DigestAlgorithm, derivedKeySecondHalf).update(ciphertext).digest();

    return new EncryptedData({
      version: version,
      id: randomness.id,
      ciphertext: ciphertext.toString('hex'),
      iv: randomness.iv.toString('hex'),
      cipher: CipherAlgorithm,
      kdf: KeyDerivationFunction,
      kdfparams: kdParams,
      mac: mac.toString('hex'),
      salt: randomness.salt.toString('hex')
    });
  }
}
