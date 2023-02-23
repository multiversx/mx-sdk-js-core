import { ErrSignerCannotSign } from "./errors";
import { IGuardableSignable } from "./interface";
import { Signature } from "./signature";
import { UserSecretKey } from "./userKeys";
import { UserSigner } from "./userSigner";

/**
 * ed25519 signer
 */
export class GuardianSigner extends UserSigner {

    constructor(secretKey: UserSecretKey) {
        super(secretKey)
    }

    /**
     * Signs a message.
     * @param signable the message to be signed (e.g. a {@link Transaction}).
     */
    async guard(signable: IGuardableSignable): Promise<void> {
        try {
            this.tryGuard(signable);
        } catch (err: any) {
            throw new ErrSignerCannotSign(err);
        }
    }

    private tryGuard(signable: IGuardableSignable) {
        const bufferToSign = signable.serializeForSigning();
        const guardianSignatureBuffer = this.secretKey.sign(bufferToSign);
        const guardianSignature = new Signature(guardianSignatureBuffer);

        signable.applyGuardianSignature(guardianSignature);
    }
}
