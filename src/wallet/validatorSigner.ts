import { ErrSignerCannotSign } from "../core/errors";
import { ValidatorPublicKey, ValidatorSecretKey } from "./validatorKeys";
import { ValidatorPEM } from "./validatorPem";

/**
 * Validator signer (BLS signer)
 */
export class ValidatorSigner {
    private readonly secretKey: ValidatorSecretKey;

    constructor(secretKey: ValidatorSecretKey) {
        this.secretKey = secretKey;
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
