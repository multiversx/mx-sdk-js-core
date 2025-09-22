import { ErrSignerCannotSign } from "../core/errors";
import { BLS, ValidatorPublicKey, ValidatorSecretKey } from "./validatorKeys";
import { ValidatorPEM } from "./validatorPem";

/**
 * Validator signer (BLS signer)
 */
export class ValidatorSigner {
    private readonly secretKey: ValidatorSecretKey;

    constructor(secretKey: ValidatorSecretKey) {
        this.secretKey = secretKey;
    }

    /**
     * * @deprecated This method will be deprecated! Use the sign method directly.
     * Signs a message.
     */
    static async signUsingPem(
        pemText: string,
        pemIndex: number = 0,
        signable: Buffer | Uint8Array,
    ): Promise<Uint8Array> {
        await BLS.initIfNecessary();

        try {
            let secretKey = ValidatorSecretKey.fromPem(pemText, pemIndex);
            return secretKey.sign(signable);
        } catch (err: any) {
            throw new ErrSignerCannotSign(err);
        }
    }

    static async fromPemFile(path: string, index = 0): Promise<ValidatorSigner> {
        const secretKey = (await ValidatorPEM.fromFile(path, index)).secretKey;
        return new ValidatorSigner(secretKey);
    }

    sign(data: Uint8Array): Uint8Array {
        try {
            return this.trySign(data);
        } catch (err: any) {
            throw new ErrSignerCannotSign(err as Error);
        }
    }

    private trySign(data: Uint8Array): Uint8Array {
        return this.secretKey.sign(data);
    }

    getPubkey(): ValidatorPublicKey {
        return this.secretKey.generatePublicKey();
    }
}
