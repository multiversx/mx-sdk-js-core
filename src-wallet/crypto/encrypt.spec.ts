import { assert } from "chai";
import { Decryptor } from "./decryptor";
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
});
