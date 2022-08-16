import { assert } from "chai";
import {loadTestWallet, TestWallet} from "../testutils/wallets";
import {PubkeyEncryptor} from "./pubkeyEncryptor";
import {UserPublicKey, UserSecretKey} from "../userKeys";
import {PubkeyDecryptor} from "./pubkeyDecryptor";
import {X25519EncryptedData} from "./x25519EncryptedData";

describe("test address", () => {
    let alice: TestWallet, bob: TestWallet, carol: TestWallet;
    const sensitiveData = Buffer.from("my secret text for x");
    let encryptedData: X25519EncryptedData;

    before(async () => {
        alice = await loadTestWallet("alice");
        bob = await loadTestWallet("bob");
        carol = await loadTestWallet("carol");

        encryptedData = PubkeyEncryptor.encrypt(sensitiveData, new UserPublicKey(bob.address.pubkey()), new UserSecretKey(alice.secretKey));
    });

    it("encrypts/decrypts",  () => {
        const decryptedData = PubkeyDecryptor.decrypt(encryptedData, new UserSecretKey(bob.secretKey));
        assert.equal(sensitiveData.toString('hex'), decryptedData.toString('hex'));
    });

    it("fails for different originator", () => {
        encryptedData.identities.originatorPubKey = carol.address.hex();
        assert.throws(() => PubkeyDecryptor.decrypt(encryptedData, new UserSecretKey(bob.secretKey)), "Invalid authentication for encrypted message originator");
    });

    it("fails for different DH public key", () => {
        encryptedData.identities.ephemeralPubKey = carol.address.hex();
        assert.throws(() => PubkeyDecryptor.decrypt(encryptedData, new UserSecretKey(bob.secretKey)), "Invalid authentication for encrypted message originator");
    });
});
