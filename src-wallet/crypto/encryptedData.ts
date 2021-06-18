import { ScryptKeyDerivationParams } from "./derivationParams";

export class EncryptedData {
  id: string;
  version: number;
  cipher: string;
  ciphertext: string;
  iv: string;
  kdf: string;
  kdfparams: ScryptKeyDerivationParams;
  salt: string;
  mac: string;

  constructor(data: Omit<EncryptedData, "toJSON">) {
    this.id = data.id;
    this.version = data.version;
    this.ciphertext = data.ciphertext;
    this.iv = data.iv;
    this.cipher = data.cipher;
    this.kdf = data.kdf;
    this.kdfparams = data.kdfparams;
    this.mac = data.mac;
    this.salt = data.salt;
  }

  toJSON(): any {
    return {
      version: this.version,
      id: this.id,
      crypto: {
        ciphertext: this.ciphertext,
        cipherparams: { iv: this.iv },
        cipher: this.cipher,
        kdf: this.kdf,
        kdfparams: {
          dklen: this.kdfparams.dklen,
          salt: this.salt,
          n: this.kdfparams.n,
          r: this.kdfparams.r,
          p: this.kdfparams.p
        },
        mac: this.mac,
      }
    };
  }
}