import { ErrInvalidArgument, ErrInvariantFailed } from "../core/errors";
import { bytesFromInput, guardLength } from "./assertions";
import { parseValidatorKey } from "./pem";

export const VALIDATOR_SECRETKEY_LENGTH = 32;
export const VALIDATOR_PUBKEY_LENGTH = 96;

export class BLS {
    private static isInitialized: boolean = false;
    private static initPromise: Promise<void> | undefined;
    public static bls: any;

    private static loadBLSModule() {
        if (!BLS.bls) {
            try {
                BLS.bls = require("@multiversx/sdk-bls-wasm");
            } catch (error) {
                throw new Error("BLS module is required but not installed. Please install '@multiversx/sdk-bls-wasm'.");
            }
        }
    }

    static async initIfNecessary() {
        // Concurrent callers must share a single initialization: each "init()" of the BLS module
        // creates a new WASM instance, which corrupts the keys created on top of the previous one.
        if (!BLS.initPromise) {
            BLS.loadBLSModule();
            BLS.initPromise = BLS.bls.init(BLS.bls.BLS12_381).then(
                () => {
                    BLS.isInitialized = true;
                },
                (error: any) => {
                    BLS.initPromise = undefined;
                    throw error;
                },
            );
        }

        await BLS.initPromise;
    }

    static guardInitialized() {
        if (!BLS.isInitialized) {
            throw new ErrInvariantFailed(
                "BLS modules are not initalized. Make sure that 'await BLS.initIfNecessary()' is called correctly.",
            );
        }
    }
}

export class ValidatorSecretKey {
    private readonly secretKey: any;
    private readonly publicKey: any;

    constructor(buffer: Buffer | Uint8Array) {
        BLS.guardInitialized();
        guardLength(buffer, VALIDATOR_SECRETKEY_LENGTH);
        const bytes = Buffer.from(bytesFromInput(buffer, "buffer"));

        // Fail fast (e.g. when loading a corrupted PEM file), instead of producing an all-zeros public key and signatures.
        if (!bytes.some((byte) => byte != 0)) {
            throw new ErrInvalidArgument("the validator secret key must not be zero");
        }

        this.secretKey = new BLS.bls.SecretKey();
        this.secretKey.setLittleEndian(new Uint8Array(bytes));

        // "setLittleEndian()" doesn't reject values that aren't lower than the order of the group: it silently changes them, instead.
        if (!Buffer.from(this.secretKey.serialize()).equals(bytes)) {
            throw new ErrInvalidArgument("the validator secret key is out of range");
        }

        this.publicKey = this.secretKey.getPublicKey();
    }

    static fromPem(text: string, index: number = 0) {
        return parseValidatorKey(text, index);
    }

    generatePublicKey(): ValidatorPublicKey {
        let buffer = Buffer.from(this.publicKey.serialize());
        return new ValidatorPublicKey(buffer);
    }

    sign(message: Buffer | Uint8Array): Buffer {
        let signatureObject = this.secretKey.sign(message);
        let signature = Buffer.from(signatureObject.serialize());
        return signature;
    }

    hex(): string {
        return this.valueOf().toString("hex");
    }

    valueOf(): Buffer {
        return Buffer.from(this.secretKey.serialize());
    }
}

export class ValidatorPublicKey {
    private readonly buffer: Buffer;

    constructor(buffer: Buffer | Uint8Array) {
        guardLength(buffer, VALIDATOR_PUBKEY_LENGTH);

        this.buffer = Buffer.from(buffer);
    }

    hex(): string {
        return this.buffer.toString("hex");
    }

    valueOf(): Buffer {
        // A copy, so that the key can't be altered through the returned buffer.
        return Buffer.from(this.buffer);
    }
}
