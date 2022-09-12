import { IAddress, ISignable, ISignature, IVerifiable } from "../interface";
import { Signature } from "../signature";

/**
 * A dummy transaction used in tests.
 */
export class TestTransaction implements ISignable, IVerifiable {
    nonce: number = 0;
    value: string = "";
    receiver: string = "";
    gasPrice: number = 0;
    gasLimit: number = 0;
    data: string = "";
    chainID: string = "";
    version: number = 1;
    options: number = 0;

    sender: string = "";
    guardian: string = "";
    guardianSignature: string = "";
    signature: string = "";

    constructor(init?: Partial<TestTransaction>) {
        Object.assign(this, init);
    }

    serializeForSigning(): Buffer {
        let dataEncoded = this.data ? Buffer.from(this.data).toString("base64") : undefined;
        let guardian = this.guardian ? this.guardian : undefined;
        let options = this.options ? this.options : undefined;

        let plainObject = {
            nonce: this.nonce,
            value: this.value,
            receiver: this.receiver,
            sender: this.sender,
            guardian: guardian,
            gasPrice: this.gasPrice,
            gasLimit: this.gasLimit,
            data: dataEncoded,
            chainID: this.chainID,
            options: options,
            version: this.version
        };

        let serialized = JSON.stringify(plainObject);
        return Buffer.from(serialized);
    }

    applySignature(signature: ISignature): void {
        this.signature = signature.hex();
    }

    applyGuardianSignature(guardianSignature: ISignature): void {
        this.guardianSignature = guardianSignature.hex()
    }

    getSignature(): ISignature {
        return new Signature(Buffer.from(this.signature, "hex"));
    }

    getGuardianSignature(): ISignature {
        return new Signature(Buffer.from(this.guardianSignature, "hex"));
    }
}
