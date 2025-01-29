import { Address } from "../core/address";
import { ErrSignerCannotSign } from "../core/errors";
import { UserSecretKey } from "./userKeys";
import { UserWallet } from "./userWallet";

/**
 * ed25519 signer
 */
export class UserSigner {
    readonly secretKey: UserSecretKey;

    constructor(secretKey: UserSecretKey) {
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

    async sign(data: Uint8Array): Promise<Uint8Array> {
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
        const bech32 = this.secretKey.generatePublicKey().toAddress(hrp).toBech32();
        return Address.newFromBech32(bech32);
    }
}
