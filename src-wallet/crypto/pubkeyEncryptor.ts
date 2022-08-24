import nacl from "tweetnacl";
import ed2curve from "ed2curve";
import crypto from "crypto";
import { X25519EncryptedData } from "./x25519EncryptedData";
import { UserPublicKey, UserSecretKey } from "../userKeys";
import { PubKeyEncCipher, PubKeyEncNonceLength, PubKeyEncVersion } from "./constants";

export class PubkeyEncryptor {
    static encrypt(data: Buffer, recipientPubKey: UserPublicKey, authSecretKey: UserSecretKey): X25519EncryptedData {
        // create a new x225519 keypair that will be used for EDH
        const edhPair = nacl.sign.keyPair();
        const recipientDHPubKey = ed2curve.convertPublicKey(recipientPubKey.valueOf());
        if (recipientDHPubKey === null) {
            throw new Error("Could not convert ed25519 public key to x25519");
        }
        const edhConvertedSecretKey = ed2curve.convertSecretKey(edhPair.secretKey);

        // For the nonce we use a random component and a deterministic one based on the message
        //  - this is so we won't completely rely on the random number generator
        const nonceDeterministic = crypto.createHash('sha256').update(data).digest().slice(0, PubKeyEncNonceLength/2);
        const nonceRandom = nacl.randomBytes(PubKeyEncNonceLength/2);
        const nonce = Buffer.concat([nonceDeterministic, nonceRandom]);
        const encryptedMessage = nacl.box(data, nonce, recipientDHPubKey, edhConvertedSecretKey);

        // Note that the ciphertext is already authenticated for the ephemeral key - but we want it authenticated by
        //  the elrond ed25519 key which the user interacts with. A signature over H(ciphertext | edhPubKey)
        //  would be enough
        const authMessage = crypto.createHash('sha256').update(
            Buffer.concat([encryptedMessage, edhPair.publicKey])
        ).digest();

        const signature = authSecretKey.sign(authMessage);

        return new X25519EncryptedData({
            version: PubKeyEncVersion,
            nonce: Buffer.from(nonce).toString('hex'),
            cipher: PubKeyEncCipher,
            ciphertext: Buffer.from(encryptedMessage).toString('hex'),
            mac: signature.toString('hex'),
            identities: {
                recipient: recipientPubKey.hex(),
                ephemeralPubKey: Buffer.from(edhPair.publicKey).toString('hex'),
                originatorPubKey: authSecretKey.generatePublicKey().hex(),
            }
        });
    }
}
