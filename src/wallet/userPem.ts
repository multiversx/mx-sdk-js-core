import { PathLike, readFileSync, writeFileSync } from "fs";
import { isAbsolute, join, resolve } from "path";
import { assertIndexIsValid, PemEntry } from "./pemEntry";
import { UserPublicKey, UserSecretKey } from "./userKeys";
import { checkIdentityOfUserPemEntry, checkLengthOfUserPemEntry, secretKeyOfUserPemEntry } from "./userPemEntries";

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
        return this.fromText(UserPem.readFile(path), index);
    }

    static fromFileAll(path: PathLike): UserPem[] {
        return this.fromTextAll(UserPem.readFile(path));
    }

    private static readFile(path: PathLike): string {
        const resolvedPath = isAbsolute(path.toString())
            ? resolve(path.toString())
            : resolve(join(process.cwd(), path.toString()));
        return readFileSync(resolvedPath, "utf-8");
    }

    /**
     * Loads the entry at the given index.
     *
     * The structure of the whole text and the length of each entry are checked. Though, only the requested entry is checked
     * against its embedded public key and its label (which requires deriving the public key - by far, the most expensive step).
     * Use "fromTextAll()" to have all the entries checked.
     */
    static fromText(text: string, index: number = 0): UserPem {
        const entries = PemEntry.fromTextAll(text);
        entries.forEach((entry) => checkLengthOfUserPemEntry(entry));
        assertIndexIsValid(index, entries.length);
        return UserPem.fromEntry(entries[index]);
    }

    static fromTextAll(text: string): UserPem[] {
        return PemEntry.fromTextAll(text).map((entry) => UserPem.fromEntry(entry));
    }

    private static fromEntry(entry: PemEntry): UserPem {
        const item = new UserPem(entry.label, secretKeyOfUserPemEntry(entry));
        checkIdentityOfUserPemEntry(entry, item.publicKey);
        return item;
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
