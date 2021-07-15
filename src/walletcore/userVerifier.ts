import { IVerifier } from "../interface";
import { SignableMessage } from "../signableMessage";
import * as errors from "../errors";
import { Address } from "../address";
import * as tweetnacl from "tweetnacl";
import {Logger} from "../logger";

/**
 * ed25519 signature verification
 */
export class UserVerifier implements IVerifier {

  address: Address;
  constructor(address: Address) {
    this.address = address;
  }

  /**
   * Verify a message's signature.
   * @param message the message to be verified.
   */
  async verify(message: SignableMessage): Promise<boolean> {
    try {
      const unopenedMessage = Buffer.concat([Buffer.from(message.signature.hex(), "hex"), message.serializeForSigning()]);
      const unsignedMessage = tweetnacl.sign.open(unopenedMessage, this.address.pubkey());
      return unsignedMessage != null;
    } catch (err) {
      Logger.error(err);
      return false;
    }
  }
}
