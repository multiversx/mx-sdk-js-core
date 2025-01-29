import { UserPublicKey, UserSecretKey } from "./userKeys";

export class KeyPair {
    readonly secretKey: UserSecretKey;
    readonly publicKey: UserPublicKey;

    constructor(secretKey: UserSecretKey) {
        this.secretKey = secretKey;
        this.publicKey = this.secretKey.generatePublicKey();
    }

    static generate(): KeyPair {
        const secretKey = UserSecretKey.generate();
        return new KeyPair(secretKey);
    }

    static newFromBytes(data: Uint8Array): KeyPair {
        const secretKey = new UserSecretKey(data);
        return new KeyPair(secretKey);
    }

    async sign(data: Uint8Array): Promise<Uint8Array> {
        return this.secretKey.sign(data);
    }

    async verify(data: Uint8Array, signature: Uint8Array): Promise<boolean> {
        return this.publicKey.verify(data, signature);
    }

    getSecretKey(): UserSecretKey {
        return this.secretKey;
    }

    getPublicKey(): UserPublicKey {
        return this.publicKey;
    }
}
