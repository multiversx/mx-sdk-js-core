import { utils } from "@noble/ed25519";
import { v4 as uuidv4 } from "uuid";
const crypto = require("crypto");

export class Randomness {
  salt: Buffer;
  iv: Buffer;
  id: string;

  constructor(init?: Partial<Randomness>) {
    this.salt = init?.salt || Buffer.from(utils.randomBytes(32));
    this.iv = init?.iv || Buffer.from(utils.randomBytes(16));
    this.id = init?.id || uuidv4({ random: crypto.randomBytes(16) });
  }
}
