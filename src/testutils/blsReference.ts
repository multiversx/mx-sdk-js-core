/**
 * The reference implementation of the validator (BLS) keys: the Herumi (MCL) WebAssembly build, "@multiversx/sdk-bls-wasm",
 * which the SDK itself used before switching to "@noble/curves".
 *
 * It is a "devDependency", loaded by the tests only, so that the outcomes of the SDK can be compared against Herumi's.
 */
export class ReferenceBls {
    private constructor(private readonly module: any) {}

    private static loading: Promise<ReferenceBls> | undefined;

    static async load(): Promise<ReferenceBls> {
        // The module must be initialized only once: each "init()" creates a new WASM instance.
        if (!ReferenceBls.loading) {
            ReferenceBls.loading = ReferenceBls.doLoad();
        }

        return await ReferenceBls.loading;
    }

    private static async doLoad(): Promise<ReferenceBls> {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const module = require("@multiversx/sdk-bls-wasm");
        await module.init(module.BLS12_381);
        return new ReferenceBls(module);
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
