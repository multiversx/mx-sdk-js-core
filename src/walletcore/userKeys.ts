import * as tweetnacl from "tweetnacl";
import { Address } from "../address";
import { guardLength } from "../utils";
import { parseUserKey } from "./pem";
import {SignableMessage} from "../signableMessage";
import {Logger} from "../logger";

export const USER_SEED_LENGTH = 32;
export const USER_PUBKEY_LENGTH = 32;

export class UserSecretKey {
    private readonly buffer: Buffer;

    constructor(buffer: Buffer) {
        guardLength(buffer, USER_SEED_LENGTH);

        this.buffer = buffer;
    }

    static fromString(value: string): UserSecretKey {
        guardLength(value, USER_SEED_LENGTH * 2);

        let buffer = Buffer.from(value, "hex");
        return new UserSecretKey(buffer);
    }

    static fromPem(text: string, index: number = 0): UserSecretKey {
        return parseUserKey(text, index);
    }

    generatePublicKey(): UserPublicKey {
        let keyPair = tweetnacl.sign.keyPair.fromSeed(new Uint8Array(this.buffer));
        let buffer = Buffer.from(keyPair.publicKey);
        return new UserPublicKey(buffer);
    }

    sign(message: Buffer): Buffer {
        let pair = tweetnacl.sign.keyPair.fromSeed(new Uint8Array(this.buffer));
        let signingKey = pair.secretKey;
        let signature = tweetnacl.sign(new Uint8Array(message), signingKey);
        // "tweetnacl.sign()" returns the concatenated [signature, message], therfore we remove the appended message:
        signature = signature.slice(0, signature.length - message.length);

        return Buffer.from(signature);
    }

    hex(): string {
        return this.buffer.toString("hex");
    }

    valueOf(): Buffer {
        return this.buffer;
    }
}

export class UserPublicKey {
    private readonly buffer: Buffer;

    constructor(buffer: Buffer) {
        guardLength(buffer, USER_PUBKEY_LENGTH);
        
        this.buffer = buffer;
    }

    verify(message: Buffer, signature: Buffer): boolean {
        try {
            const unopenedMessage = Buffer.concat([Buffer.from(message.signature.hex(), "hex"), message]);
            const unsignedMessage = tweetnacl.sign.open(unopenedMessage, this.address.pubkey());
            return unsignedMessage != null;
        } catch (err) {
            Logger.error(err);
            return false;
        }
    }

    hex(): string {
        return this.buffer.toString("hex");
    }

    toAddress(): Address {
        return new Address(this.buffer);
    }

    valueOf(): Buffer {
        return this.buffer;
    }
}
