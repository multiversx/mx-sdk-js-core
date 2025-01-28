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

    sign(data: Uint8Array): Uint8Array {
        // Signs the data using the secret key of the keypair
        return this.secretKey.sign(data);
    }

    verify(data: Uint8Array, signature: Uint8Array): boolean {
        // Verifies the data using the public key of the keypair
        return this.publicKey.verify(data, signature);
    }

    getSecretKey(): UserSecretKey {
        return this.secretKey;
    }

    getPublicKey(): UserPublicKey {
        return this.publicKey;
    }
}
