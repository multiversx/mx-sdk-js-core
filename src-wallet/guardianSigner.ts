import { ISignable, ISignature } from "./interface";
import { UserSecretKey } from "./userKeys";
import { UserSigner } from "./userSigner";
import { Signature } from "./signature";
import { ErrSignerCannotSign } from "./errors";

/**
 * ed25519 signer
 */
export class GuardianSigner extends UserSigner {
    private readonly guardianSecretKey: UserSecretKey;

    constructor(guardianSecretKey: UserSecretKey) {
        super(guardianSecretKey)
        this.guardianSecretKey = guardianSecretKey
    }

/**
 * Signs a message.
 * @param signable the message to be signed (e.g. a {@link Transaction}).
 */
    async guard(signable: ISignable): Promise<void> {
        try {
            this.tryGuard(signable);
        } catch (err: any) {
            throw new ErrSignerCannotSign(err);
        }
    }

    private tryGuard(signable: ISignable) {
        let ownerSignature = signable.getSignature()
        let bufferToSign = signable.serializeForSigning();
        let guardianSignatureBuffer = this.guardianSecretKey.sign(bufferToSign);
        let guardianSignature = new Signature(guardianSignatureBuffer);

        this.addOwnerSignature(signable, ownerSignature)
        this.doApplySignature(signable, guardianSignature);
    }

    protected doApplySignature(signable: ISignable, guardianSignature: ISignature): void {
        signable.applyGuardianSignature(guardianSignature);
    }

    private addOwnerSignature(signable: ISignable, ownerSignature: ISignature) {
        signable.applySignature(ownerSignature);
    }
}
