import { BLS } from "../wallet/validatorKeys";

/**
 * The reference implementation of the validator (BLS) keys: the Herumi (MCL) WebAssembly build, "@multiversx/sdk-bls-wasm".
 *
 * It is loaded here directly, not through the SDK, so that the tests relying on it keep comparing the SDK against Herumi
 * even after the SDK itself stops using this module (the module then has to stay as a "devDependency").
 */
export class ReferenceBls {
    private constructor(private readonly module: any) {}

    private static loading: Promise<ReferenceBls> | undefined;

    static async load(): Promise<ReferenceBls> {
        if (!ReferenceBls.loading) {
            ReferenceBls.loading = ReferenceBls.doLoad();
        }

        return await ReferenceBls.loading;
    }

    private static async doLoad(): Promise<ReferenceBls> {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const module = require("@multiversx/sdk-bls-wasm");

        // As long as the SDK runs on this very module, the SDK has to be the one that initializes it:
        // each "init()" creates a new WASM instance, and the SDK guards against that.
        await BLS.initIfNecessary();

        if ((BLS as any).bls !== module) {
            await module.init(module.BLS12_381);
        }

        return new ReferenceBls(module);
    }

    /**
     * Whether the SDK computes on the reference module itself (in which case comparing the two proves nothing).
     */
    isUsedBySdk(): boolean {
        return (BLS as any).bls === this.module;
    }

    getPublicKey(secretKey: Uint8Array): Buffer {
        return Buffer.from(this.loadSecretKey(secretKey).getPublicKey().serialize());
    }

    sign(secretKey: Uint8Array, message: Uint8Array): Buffer {
        return Buffer.from(this.loadSecretKey(secretKey).sign(Uint8Array.from(message)).serialize());
    }

    /**
     * Throws if the public key or the signature cannot be decoded (e.g. not a point on the curve).
     */
    verify(publicKey: Uint8Array, message: Uint8Array, signature: Uint8Array): boolean {
        const publicKeyObject = new this.module.PublicKey();
        publicKeyObject.deserialize(Uint8Array.from(publicKey));

        const signatureObject = new this.module.Signature();
        signatureObject.deserialize(Uint8Array.from(signature));

        return publicKeyObject.verify(signatureObject, Uint8Array.from(message));
    }

    /**
     * Decodes, then encodes again. The outcome equals the input only if the input is in the canonical form.
     */
    reencodePublicKey(publicKey: Uint8Array): Buffer {
        const object = new this.module.PublicKey();
        object.deserialize(Uint8Array.from(publicKey));
        return Buffer.from(object.serialize());
    }

    reencodeSignature(signature: Uint8Array): Buffer {
        const object = new this.module.Signature();
        object.deserialize(Uint8Array.from(signature));
        return Buffer.from(object.serialize());
    }

    private loadSecretKey(secretKey: Uint8Array): any {
        const object = new this.module.SecretKey();
        object.setLittleEndian(Uint8Array.from(secretKey));

        // "setLittleEndian()" silently alters the keys that aren't lower than the order of the group.
        if (!Buffer.from(object.serialize()).equals(Buffer.from(secretKey))) {
            throw new Error("the reference implementation was given a secret key that is out of range");
        }

        return object;
    }
}
