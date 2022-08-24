import crypto from "crypto";
import nacl from "tweetnacl";
import ed2curve from "ed2curve";
import { X25519EncryptedData } from "./x25519EncryptedData";
import { UserPublicKey, UserSecretKey } from "../userKeys";

export class PubkeyDecryptor {
    static decrypt(data: X25519EncryptedData, decryptorSecretKey: UserSecretKey): Buffer {
        const ciphertext = Buffer.from(data.ciphertext, 'hex');
        const edhPubKey = Buffer.from(data.identities.ephemeralPubKey, 'hex');
        const originatorPubKeyBuffer = Buffer.from(data.identities.originatorPubKey, 'hex');
        const originatorPubKey = new UserPublicKey(originatorPubKeyBuffer);

        const authMessage = crypto.createHash('sha256').update(
            Buffer.concat([ciphertext, edhPubKey])
        ).digest();

        if (!originatorPubKey.verify(authMessage, Buffer.from(data.mac, 'hex'))) {
            throw new Error("Invalid authentication for encrypted message originator");
        }

        const nonce = Buffer.from(data.nonce, 'hex');
        const x25519Secret = ed2curve.convertSecretKey(decryptorSecretKey.valueOf());
        const x25519EdhPubKey = ed2curve.convertPublicKey(edhPubKey);
        if (x25519EdhPubKey === null) {
            throw new Error("Could not convert ed25519 public key to x25519");
        }

        const decryptedMessage = nacl.box.open(ciphertext, nonce, x25519EdhPubKey, x25519Secret);
        if (decryptedMessage === null) {
            throw new Error("Failed authentication for given ciphertext");
        }

        return Buffer.from(decryptedMessage);
    }
}
