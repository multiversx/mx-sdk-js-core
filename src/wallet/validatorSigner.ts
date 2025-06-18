import { ErrSignerCannotSign } from "../core/errors";
import { BLS, ValidatorSecretKey } from "./validatorKeys";

/**
 * Validator signer (BLS signer)
 */
export class ValidatorSigner {
    /**
     * Signs a message.
     */
    async signUsingPem(pemText: string, pemIndex: number = 0, signable: Buffer | Uint8Array): Promise<Uint8Array> {
        await BLS.initIfNecessary();

        try {
            let secretKey = ValidatorSecretKey.fromPem(pemText, pemIndex);
            return secretKey.sign(signable);
        } catch (err: any) {
            throw new ErrSignerCannotSign(err);
        }
    }
}
