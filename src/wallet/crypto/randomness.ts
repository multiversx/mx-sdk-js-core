import { utils } from "@noble/ed25519";
const crypto = require("crypto");

export class Randomness {
  salt: Buffer;
  iv: Buffer;
  id: string;

  constructor(init?: Partial<Randomness>) {
    this.salt = init?.salt || Buffer.from(utils.randomBytes(32));
    this.iv = init?.iv || Buffer.from(utils.randomBytes(16));
    this.id = init?.id || newUuidV4();
  }
}

// A random UUID (version 4, RFC 9562), as the "id" of the keystore.
function newUuidV4(): string {
  const bytes: Buffer = crypto.randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
