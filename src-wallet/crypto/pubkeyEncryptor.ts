import nacl from "tweetnacl";
import ed2curve from "ed2curve";
import {X25519EncryptedData} from "./x25519EncryptedData";
import {UserPublicKey, UserSecretKey} from "../userKeys";

export class PubkeyEncryptor {
    public static encrypt(data: Buffer, endUserPubKey: UserPublicKey, authSecretKey: UserSecretKey): X25519EncryptedData {
        // create a new x225519 keypair that will be used for EDH
        const edhPair = nacl.sign.keyPair();

        const endUserDHPubKey = ed2curve.convertPublicKey(endUserPubKey.valueOf());
        if (endUserDHPubKey === null) {
            throw new Error("Could not convert ed25519 public key to x25519");
        }

        const nonce = nacl.randomBytes(24);
        const encryptedMessage = nacl.box(data, nonce, endUserDHPubKey, edhPair.secretKey);

        // Note that the ciphertext is already authenticated for the ephemeral key - but we want it authenticated by
        //  the an elrond ed25519 key which the user interacts with. A signature over H(ciphertext | edhPubKey)
        //  would be enough


        return new X25519EncryptedData({
            version: 1,
            nonce: Buffer.from(nonce).toString('hex'),
            cipher: "",
            ciphertext: Buffer.from(encryptedMessage).toString('hex'),
            mac: '',
        });
    }
}