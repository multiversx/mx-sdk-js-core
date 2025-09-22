import { ValidatorPEM, ValidatorPublicKey, ValidatorSigner } from "../wallet";

export class ValidatorsSigners {
    private signers: ValidatorSigner[];

    constructor(validatorSigners: ValidatorSigner[]) {
        this.signers = validatorSigners;
    }

    static async newFromPem(filePath: string): Promise<ValidatorsSigners> {
        const validatorPemFiles = await ValidatorPEM.fromFileAll(filePath);
        const signers = validatorPemFiles.map((pem) => new ValidatorSigner(pem.secretKey));
        return new ValidatorsSigners(signers);
    }

    getNumOfNodes(): number {
        return this.signers.length;
    }

    getSigners(): ValidatorSigner[] {
        return this.signers;
    }

    getPublicKeys(): ValidatorPublicKey[] {
        return this.signers.map((signer) => signer.getPubkey());
    }
}
