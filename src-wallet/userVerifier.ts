import { IAddress } from "./interface";
import { UserPublicKey } from "./userKeys";

/**
 * ed25519 signature verification
 */
export class UserVerifier {

  publicKey: UserPublicKey;
  constructor(publicKey: UserPublicKey) {
    this.publicKey = publicKey;
  }

  static fromAddress(address: IAddress): UserVerifier {
    let publicKey = new UserPublicKey(address.pubkey());
    return new UserVerifier(publicKey);
  }

  /**
   * 
   * @param data the raw data to be verified (e.g. an already-serialized enveloped message)
   * @param signature the signature to be verified
   * @returns true if the signature is valid, false otherwise
   */
  verify(data: Buffer, signature: Buffer): boolean {
    return this.publicKey.verify(data, signature);
  }
}
