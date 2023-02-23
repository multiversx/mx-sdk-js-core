import { IVerifiable } from "./interface";
import { UserPublicKey } from "./userKeys";

interface IAddress {
  pubkey(): Buffer;
}

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
   * Verify a message's signature.
   * @param message the message to be verified.
   */
  verify(message: IVerifiable): boolean {
    return this.publicKey.verify(
      message.serializeForSigning(),
      Buffer.from(message.getSignature().hex(), 'hex'));
  }
}
