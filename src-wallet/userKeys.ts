import * as ed from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha512";
import { guardLength } from "./assertions";
import { parseUserKey } from "./pem";
import { UserAddress } from "./userAddress";

export const USER_SEED_LENGTH = 32;
export const USER_PUBKEY_LENGTH = 32;

// See: https://github.com/paulmillr/noble-ed25519
// In a future version of sdk-wallet, we'll switch to using the async functions of noble-ed25519.
ed.utils.sha512Sync = (...m) => sha512(ed.utils.concatBytes(...m));

export class UserSecretKey {
    private readonly buffer: Uint8Array;

    constructor(buffer: Uint8Array) {
        guardLength(buffer, USER_SEED_LENGTH);

        this.buffer = buffer;
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
        const buffer = ed.sync.getPublicKey(this.buffer);
        return new UserPublicKey(buffer);
    }

    sign(message: Buffer): Buffer {
        const signature = ed.sync.sign(message, this.buffer);
        return Buffer.from(signature);
    }

    hex(): string {
        return Buffer.from(this.buffer).toString("hex");
    }

    valueOf(): Buffer {
        return Buffer.from(this.buffer);
    }
}

export class UserPublicKey {
    private readonly buffer: Buffer;

    constructor(buffer: Uint8Array) {
        guardLength(buffer, USER_PUBKEY_LENGTH);

        this.buffer = Buffer.from(buffer);
    }

    verify(data: Buffer, signature: Buffer): boolean {
        try {
            const ok = ed.sync.verify(signature, data, this.buffer);
            return ok;
        } catch (err: any) {
            console.error(err);
            return false;
        }
    }

    hex(): string {
        return this.buffer.toString("hex");
    }

    toAddress(): UserAddress {
        return new UserAddress(this.buffer);
    }

    valueOf(): Buffer {
        return this.buffer;
    }
}
