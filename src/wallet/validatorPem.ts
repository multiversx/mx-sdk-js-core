import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { PemEntry } from "../wallet/pemEntry";
import { BLS, ValidatorSecretKey } from "../wallet/validatorKeys";

export class ValidatorPEM {
    label: string;
    secretKey: ValidatorSecretKey;

    constructor(label: string, secretKey: ValidatorSecretKey) {
        this.label = label;
        this.secretKey = secretKey;
    }

    static async fromFile(path: string, index = 0): Promise<ValidatorPEM> {
        return (await this.fromFileAll(path))[index];
    }

    static async fromFileAll(path: string): Promise<ValidatorPEM[]> {
        const absPath = resolve(path);
        const text = readFileSync(absPath, "utf-8");
        return await this.fromTextAll(text);
    }

    static async fromText(text: string, index = 0): Promise<ValidatorPEM> {
        return (await ValidatorPEM.fromTextAll(text))[index];
    }

    static async fromTextAll(text: string): Promise<ValidatorPEM[]> {
        const entries = PemEntry.fromTextAll(text);
        const resultItems: ValidatorPEM[] = [];

        for (const entry of entries) {
            await BLS.initIfNecessary();
            const secretKey = new ValidatorSecretKey(entry.message);
            const item = new ValidatorPEM(entry.label, secretKey);
            resultItems.push(item);
        }

        return resultItems;
    }

    save(path: string): void {
        const absPath = resolve(path);
        writeFileSync(absPath, this.toText(), "utf-8");
    }

    toText(): string {
        const message = this.secretKey.valueOf();
        return new PemEntry(this.label, message).toText();
    }
}
