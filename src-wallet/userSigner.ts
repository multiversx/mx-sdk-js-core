import { ErrSignerCannotSign } from "./errors";
import { UserAddress } from "./userAddress";
import { UserSecretKey } from "./userKeys";
import { UserWallet } from "./userWallet";

interface IUserSecretKey {
    sign(message: Buffer): Buffer;
    generatePublicKey(): IUserPublicKey;
}

interface IUserPublicKey {
    toAddress(): { bech32(): string; };
}


/**
 * ed25519 signer
 */
export class UserSigner {
    protected readonly secretKey: IUserSecretKey;

    constructor(secretKey: IUserSecretKey) {
        this.secretKey = secretKey;
    }

    static fromWallet(keyFileObject: any, password: string): UserSigner {
        let secretKey = UserWallet.decryptSecretKey(keyFileObject, password);
        return new UserSigner(secretKey);
    }

    static fromPem(text: string, index: number = 0) {
        let secretKey = UserSecretKey.fromPem(text, index);
        return new UserSigner(secretKey);
    }

    async sign(data: Buffer): Promise<Buffer> {
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
    getAddress(): UserAddress {
        const bech32 = this.secretKey.generatePublicKey().toAddress().bech32();
        return UserAddress.fromBech32(bech32);
    }
}
