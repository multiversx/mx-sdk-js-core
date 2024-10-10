import { Address } from "../address";
import { ErrSignerCannotSign } from "../errors";
import { UserSecretKey } from "./userKeys";
import { UserWallet } from "./userWallet";

interface IUserSecretKey {
    sign(message: Buffer | Uint8Array): Buffer;
    generatePublicKey(): IUserPublicKey;
}

interface IUserPublicKey {
    toAddress(hrp?: string): { bech32(): string };
}

/**
 * ed25519 signer
 */
export class UserSigner {
    protected readonly secretKey: IUserSecretKey;

    constructor(secretKey: IUserSecretKey) {
        this.secretKey = secretKey;
    }

    static fromWallet(keyFileObject: any, password: string, addressIndex?: number): UserSigner {
        const secretKey = UserWallet.decrypt(keyFileObject, password, addressIndex);
        return new UserSigner(secretKey);
    }

    static fromPem(text: string, index: number = 0) {
        let secretKey = UserSecretKey.fromPem(text, index);
        return new UserSigner(secretKey);
    }

    async sign(data: Buffer | Uint8Array): Promise<Buffer> {
        try {
            const signature = this.secretKey.sign(data);
            return signature;
        } catch (err: any) {
            throw new ErrSignerCannotSign(err);
        }
    }

    /**
     * Gets the address of the signer.
     */
    getAddress(hrp?: string): Address {
        const bech32 = this.secretKey.generatePublicKey().toAddress(hrp).bech32();
        return Address.newFromBech32(bech32);
    }
}
