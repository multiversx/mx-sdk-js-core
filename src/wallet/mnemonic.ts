import { derivePath } from "ed25519-hd-key";
import { ErrBadMnemonicEntropy, ErrWrongMnemonic } from "../errors";
import { UserSecretKey } from "./userKeys";

const MNEMONIC_STRENGTH = 256;
const BIP44_DERIVATION_PREFIX = "m/44'/508'/0'/0'";

let bip39: any;

// Load bip39 when needed
function loadBip39() {
    if (!bip39) {
        try {
            bip39 = require("bip39");
        } catch (error) {
            throw new Error("bip39 is required but not installed. Please install 'bip39' to use mnemonic features.");
        }
    }
}

export class Mnemonic {
    private readonly text: string;

    private constructor(text: string) {
        this.text = text;
    }

    static generate(): Mnemonic {
        loadBip39();
        const text = bip39.generateMnemonic(MNEMONIC_STRENGTH);
        return new Mnemonic(text);
    }

    static fromString(text: string) {
        loadBip39();
        text = text.trim();

        Mnemonic.assertTextIsValid(text);
        return new Mnemonic(text);
    }

    static fromEntropy(entropy: Uint8Array): Mnemonic {
        loadBip39();
        try {
            const text = bip39.entropyToMnemonic(Buffer.from(entropy));
            return new Mnemonic(text);
        } catch (err: any) {
            throw new ErrBadMnemonicEntropy(err);
        }
    }

    public static assertTextIsValid(text: string) {
        loadBip39();
        let isValid = bip39.validateMnemonic(text);

        if (!isValid) {
            throw new ErrWrongMnemonic();
        }
    }

    deriveKey(addressIndex: number = 0, password: string = ""): UserSecretKey {
        loadBip39();
        let seed = bip39.mnemonicToSeedSync(this.text, password);
        let derivationPath = `${BIP44_DERIVATION_PREFIX}/${addressIndex}'`;
        let derivationResult = derivePath(derivationPath, seed.toString("hex"));
        let key = derivationResult.key;
        return new UserSecretKey(key);
    }

    getWords(): string[] {
        return this.text.split(" ");
    }

    getEntropy(): Uint8Array {
        loadBip39();
        const entropy = bip39.mnemonicToEntropy(this.text);
        return Buffer.from(entropy, "hex");
    }

    toString(): string {
        return this.text;
    }
}
