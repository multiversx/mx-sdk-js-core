import { assert } from "chai";
import { Encryptor } from "./encryptor";
import { Decryptor } from "./decryptor";

describe("test address", () => {
  it("encrypts/decrypts",  () => {
    const sensitiveData = Buffer.from("my mnemonic");
    const encryptedData = Encryptor.encrypt(sensitiveData, "password123");
    const decryptedBuffer = Decryptor.decrypt(encryptedData, "password123");

    assert.equal(sensitiveData.toString('hex'), decryptedBuffer.toString('hex'));
  });
});