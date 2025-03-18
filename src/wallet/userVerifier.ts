import { Address } from "../core/address";
import { UserPublicKey } from "./userKeys";

/**
 * ed25519 signature verification
 */
export class UserVerifier {
    publicKey: UserPublicKey;

    constructor(publicKey: UserPublicKey) {
        this.publicKey = publicKey;
    }

    static fromAddress(address: Address): UserVerifier {
        let publicKey = new UserPublicKey(address.getPublicKey());
        return new UserVerifier(publicKey);
    }

    /**
     *
     * @param data the raw data to be verified (e.g. an already-serialized enveloped message)
     * @param signature the signature to be verified
     * @returns true if the signature is valid, false otherwise
     */
    async verify(data: Buffer | Uint8Array, signature: Buffer | Uint8Array): Promise<boolean> {
        return this.publicKey.verify(data, signature);
    }
}
