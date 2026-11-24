import { assert } from "chai";
import crypto from "crypto";
import { ErrBadKeystore } from "../../core/errors";
import { Decryptor } from "./decryptor";
import { ScryptKeyDerivationParams } from "./derivationParams";
import { EncryptedData } from "./encryptedData";
import { Encryptor } from "./encryptor";

describe("test address", () => {
  it("encrypts/decrypts", () => {
    const sensitiveData = Buffer.from("my mnemonic");
    const encryptedData = Encryptor.encrypt(sensitiveData, "password123");
    const decryptedBuffer = Decryptor.decrypt(encryptedData, "password123");

    assert.equal(sensitiveData.toString('hex'), decryptedBuffer.toString('hex'));
  });

  it("encodes/decodes kdfparams", () => {
    const sensitiveData = Buffer.from("my mnemonic");
    const encryptedData = Encryptor.encrypt(sensitiveData, "password123");
    const decodedData = EncryptedData.fromJSON(encryptedData.toJSON());

    assert.deepEqual(decodedData, encryptedData, "invalid decoded data");
  });

  it("rejects unsupported cipher", () => {
    const encryptedData = Encryptor.encrypt(Buffer.from("my mnemonic"), "password123");
    encryptedData.cipher = "aes-128-ofb";

    assert.throws(() => Decryptor.decrypt(encryptedData, "password123"), ErrBadKeystore, "unsupported cipher: aes-128-ofb");
  });

  it("rejects unsupported key derivation function", () => {
    const encryptedData = Encryptor.encrypt(Buffer.from("my mnemonic"), "password123");
    encryptedData.kdf = "pbkdf2";

    assert.throws(() => Decryptor.decrypt(encryptedData, "password123"), ErrBadKeystore, "unsupported key derivation function: pbkdf2");
  });

  it("rejects IV of unexpected length", () => {
    const encryptedData = Encryptor.encrypt(Buffer.from("my mnemonic"), "password123");
    encryptedData.iv = encryptedData.iv.slice(0, 16);

    assert.throws(() => Decryptor.decrypt(encryptedData, "password123"), ErrBadKeystore, "unexpected length of IV: 8");
  });

  it("rejects shorter derived key, even if the MAC matches", () => {
    // With "dklen = 16", the MAC key would be empty: anyone could compute the MAC, and any password would be accepted.
    const encryptedData = Encryptor.encrypt(Buffer.from("my mnemonic"), "password123");
    encryptedData.kdfparams = new ScryptKeyDerivationParams(4096, 8, 1, 16);
    encryptedData.mac = crypto
      .createHmac("sha256", Buffer.alloc(0))
      .update(Buffer.from(encryptedData.ciphertext, "hex"))
      .digest("hex");

    for (const password of ["password123", "any password at all"]) {
      assert.throws(() => Decryptor.decrypt(encryptedData, password), ErrBadKeystore, "unsupported scrypt parameter: dklen = 16");
    }
  });
});
