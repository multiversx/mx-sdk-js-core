import {IVerifiable, IVerifier} from "../interface";
import {Address} from "../address";
import {UserPublicKey} from "./userKeys";

/**
 * ed25519 signature verification
 */
export class UserVerifier implements IVerifier {

  publicKey: UserPublicKey;
  constructor(publicKey: UserPublicKey) {
    this.publicKey = publicKey;
  }

  static fromAddress(address: Address): IVerifier {
    let publicKey = new UserPublicKey(address.pubkey());
    return new UserVerifier(publicKey);
  }

  /**
   * Verify a message's signature.
   * @param message the message to be verified.
   */
  verify(message: IVerifiable): boolean {
    return this.publicKey.verify(
      message.serializeForSigning(this.publicKey.toAddress()),
      Buffer.from(message.getSignature().hex(), 'hex'));
  }
}
