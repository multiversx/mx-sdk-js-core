import { ErrSignerCannotSign } from "./errors";
import { ISignable } from "./interface";
import { Signature } from "./signature";
import { UserAddress } from "./userAddress";
import { UserSecretKey } from "./userKeys";
import { UserWallet } from "./userWallet";

/**
 * ed25519 signer
 */
export class UserSigner {
    protected readonly secretKey: UserSecretKey;

    constructor(secretKey: UserSecretKey) {
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

    /**
     * Signs a message.
     * @param signable the message to be signed (e.g. a {@link Transaction}).
     */
    async sign(signable: ISignable): Promise<void> {
        try {
            this.trySign(signable);
        } catch (err: any) {
            throw new ErrSignerCannotSign(err);
        }
    }

    private trySign(signable: ISignable) {
        let bufferToSign = signable.serializeForSigning();
        let signatureBuffer = this.secretKey.sign(bufferToSign);
        let signature = new Signature(signatureBuffer);

        signable.applySignature(signature);
    }

    /**
     * Gets the address of the signer.
     */
    getAddress(): UserAddress {
        return this.secretKey.generatePublicKey().toAddress();
    }
}
