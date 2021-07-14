import {ISignable} from "./interface";
import {Signature} from "./signature";
const createKeccakHash = require("keccak");

export const MESSAGE_PREFIX = "\x17Elrond Signed Message:\n";

export class SignableMessage implements ISignable {

  /**
   * Actual message being signed.
   */
  value: Buffer;
  /**
   * Signature obtained by a signer of type @param signer .
   */
  signature: Signature;

  public constructor(init?: Partial<SignableMessage>) {
    this.value = Buffer.from([]);
    this.signature = new Signature();

    Object.assign(this, init);
  }

  serializeForSigning(): Buffer {
    let bytesToHash = Buffer.concat([Buffer.from(MESSAGE_PREFIX), this.value]);
    return createKeccakHash("keccak256").update(bytesToHash).digest();
  }

  serializeForSigningRaw(): Buffer {
    return this.value;
  }

  applySignature(signature: Signature): void {
    this.signature = signature;
  }
}