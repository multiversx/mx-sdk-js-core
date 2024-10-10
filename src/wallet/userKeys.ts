import * as ed from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha512";
import { Address } from "../address";
import { guardLength } from "./assertions";
import { parseUserKey } from "./pem";

export const USER_SEED_LENGTH = 32;
export const USER_PUBKEY_LENGTH = 32;

// See: https://github.com/paulmillr/noble-ed25519
// In a future version of sdk-wallet, we'll switch to using the async functions of noble-ed25519.
ed.utils.sha512Sync = (...m) => sha512(ed.utils.concatBytes(...m));

export class UserSecretKey {
    private readonly buffer: Buffer;

    constructor(buffer: Uint8Array) {
        guardLength(buffer, USER_SEED_LENGTH);

        this.buffer = Buffer.from(buffer);
    }

    static fromString(value: string): UserSecretKey {
        guardLength(value, USER_SEED_LENGTH * 2);

        const buffer = Buffer.from(value, "hex");
        return new UserSecretKey(buffer);
    }

    static fromPem(text: string, index: number = 0): UserSecretKey {
        return parseUserKey(text, index);
    }

    generatePublicKey(): UserPublicKey {
        const buffer = ed.sync.getPublicKey(new Uint8Array(this.buffer));
        return new UserPublicKey(buffer);
    }

    sign(message: Buffer | Uint8Array): Buffer {
        const signature = ed.sync.sign(new Uint8Array(message), new Uint8Array(this.buffer));
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

    constructor(buffer: Uint8Array) {
        guardLength(buffer, USER_PUBKEY_LENGTH);

        this.buffer = Buffer.from(buffer);
    }

    verify(data: Buffer | Uint8Array, signature: Buffer | Uint8Array): boolean {
        try {
            const ok = ed.sync.verify(new Uint8Array(signature), new Uint8Array(data), new Uint8Array(this.buffer));
            return ok;
        } catch (err: any) {
            console.error(err);
            return false;
        }
    }

    hex(): string {
        return this.buffer.toString("hex");
    }

    toAddress(hrp?: string): Address {
        return new Address(this.buffer, hrp);
    }

    valueOf(): Buffer {
        return this.buffer;
    }
}
