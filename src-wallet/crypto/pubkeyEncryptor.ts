import nacl from "tweetnacl";
import ed2curve from "ed2curve";
import crypto, {sign} from "crypto";
import {X25519EncryptedData} from "./x25519EncryptedData";
import {UserPublicKey, UserSecretKey} from "../userKeys";
import {PubKeyEncCipher, PubKeyEncNonceLength, PubKeyEncVersion} from "./constants";

export class PubkeyEncryptor {
    static encrypt(data: Buffer, recipientPubKey: UserPublicKey, authSecretKey: UserSecretKey): X25519EncryptedData {
        // create a new x225519 keypair that will be used for EDH
        const edhPair = nacl.sign.keyPair();
        const recipientDHPubKey = ed2curve.convertPublicKey(recipientPubKey.valueOf());
        if (recipientDHPubKey === null) {
            throw new Error("Could not convert ed25519 public key to x25519");
        }
        const edhConvertedSecretKey = ed2curve.convertSecretKey(edhPair.secretKey);

        const nonce = nacl.randomBytes(PubKeyEncNonceLength);
        const encryptedMessage = nacl.box(data, nonce, recipientDHPubKey, edhConvertedSecretKey);

        // Note that the ciphertext is already authenticated for the ephemeral key - but we want it authenticated by
        //  the an elrond ed25519 key which the user interacts with. A signature over H(ciphertext | edhPubKey)
        //  would be enough
        const authSig = crypto.createHash('sha256').update(
            Buffer.concat([encryptedMessage, edhPair.publicKey])
        ).digest();

        const signature = authSecretKey.sign(authSig);

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
