import { PathLike, readFileSync, writeFileSync } from "fs";
import { isAbsolute, join, resolve } from "path";
import { PemEntry } from "./pemEntry";
import { USER_SEED_LENGTH, UserPublicKey, UserSecretKey } from "./userKeys";

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
        return this.fromFileAll(path)[index];
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
        return items[index];
    }

    static fromTextAll(text: string): UserPem[] {
        const entries = PemEntry.fromTextAll(text);
        const resultItems: UserPem[] = [];

        for (const entry of entries) {
            const secretKey = new UserSecretKey(entry.message.slice(0, USER_SEED_LENGTH));
            const item = new UserPem(entry.label, secretKey);
            resultItems.push(item);
        }

        return resultItems;
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
