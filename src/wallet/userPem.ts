import { PathLike, readFileSync, writeFileSync } from "fs";
import { isAbsolute, join, resolve } from "path";
import { Address } from "../core/address";
import { ErrBadPEM } from "../core/errors";
import { assertIndexIsValid, PemEntry } from "./pemEntry";
import { USER_PUBKEY_LENGTH, USER_SEED_LENGTH, UserPublicKey, UserSecretKey } from "./userKeys";

export class UserPem {
    label: string;
    secretKey: UserSecretKey;
    publicKey: UserPublicKey;

    constructor(label: string, secretKey: UserSecretKey) {
        this.label = label;
        this.secretKey = secretKey;
        this.publicKey = secretKey.generatePublicKey();
    }

    static fromFile(path: PathLike, index: number = 0): UserPem {
        const items = this.fromFileAll(path);
        assertIndexIsValid(index, items.length);
        return items[index];
    }

    static fromFileAll(path: PathLike): UserPem[] {
        const resolvedPath = isAbsolute(path.toString())
            ? resolve(path.toString())
            : resolve(join(process.cwd(), path.toString()));
        const text = readFileSync(resolvedPath, "utf-8");
        return this.fromTextAll(text);
    }

    static fromText(text: string, index: number = 0): UserPem {
        const items = this.fromTextAll(text);
        assertIndexIsValid(index, items.length);
        return items[index];
    }

    static fromTextAll(text: string): UserPem[] {
        const entries = PemEntry.fromTextAll(text);
        const resultItems: UserPem[] = [];

        for (const entry of entries) {
            // The message holds the secret key, optionally followed by the public key.
            const length = entry.message.length;
            if (length != USER_SEED_LENGTH && length != USER_SEED_LENGTH + USER_PUBKEY_LENGTH) {
                throw new ErrBadPEM(
                    `incorrect key length: expected ${USER_SEED_LENGTH} or ${USER_SEED_LENGTH + USER_PUBKEY_LENGTH}, found ${length}`,
                );
            }

            const secretKey = new UserSecretKey(entry.message.slice(0, USER_SEED_LENGTH));
            const item = new UserPem(entry.label, secretKey);
            UserPem.checkIdentity(entry, item.publicKey);
            resultItems.push(item);
        }

        return resultItems;
    }

    private static checkIdentity(entry: PemEntry, publicKey: UserPublicKey) {
        const embeddedPublicKey = Buffer.from(entry.message.slice(USER_SEED_LENGTH));
        if (embeddedPublicKey.length && !embeddedPublicKey.equals(publicKey.valueOf())) {
            throw new ErrBadPEM("the embedded public key does not match the secret key");
        }

        // Generally, the label is the bech32 address of the account. Other labels (e.g. custom ones) are accepted, as before.
        // The HRP isn't checked, so that files saved with a custom HRP can be loaded, as well.
        let labelPublicKey: Buffer;
        try {
            labelPublicKey = Address.newFromBech32(entry.label).getPublicKey();
        } catch {
            return;
        }

        if (!labelPublicKey.equals(publicKey.valueOf())) {
            throw new ErrBadPEM("the label (address) does not match the secret key");
        }
    }

    save(path: PathLike): void {
        const resolvedPath = isAbsolute(path.toString())
            ? resolve(path.toString())
            : resolve(join(process.cwd(), path.toString()));
        writeFileSync(resolvedPath, this.toText(), { encoding: "utf-8" });
    }

    toText(): string {
        const message = new Uint8Array([...this.secretKey.valueOf(), ...this.publicKey.valueOf()]);
        const pemEntry = new PemEntry(this.label, message);
        return pemEntry.toText();
    }
}
