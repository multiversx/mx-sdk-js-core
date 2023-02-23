import { ISignable, ISignature, IVerifiable } from "../interface";
import { Signature } from "../signature";

/**
 * A dummy message used in tests.
 */
export class TestMessage implements ISignable, IVerifiable {
    foo: string = "";
    bar: string = "";
    signature: string = "";
    guardianSignature: string = "";

    constructor(init?: Partial<TestMessage>) {
        Object.assign(this, init);
    }

    serializeForSigning(): Buffer {
        let plainObject = {
            foo: this.foo,
            bar: this.bar
        };

        let serialized = JSON.stringify(plainObject);
        return Buffer.from(serialized);
    }

    applySignature(signature: ISignature) {
        this.signature = signature.hex();
    }

    applyGuardianSignature(guardianSignature: ISignature) {
        this.guardianSignature = guardianSignature.hex()
    }

    getSignature(): ISignature {
        return new Signature(Buffer.from(this.signature, "hex"));
    }
}
