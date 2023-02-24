import { IAddress, ISignature } from "../interface";
import { Signature } from "../signature";

/**
 * A dummy transaction used in tests.
 */
export class TestTransaction {
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
    signature: string = "";

    constructor(init?: Partial<TestTransaction>) {
        Object.assign(this, init);
    }

    serializeForSigning(signedBy: IAddress): Buffer {
        let sender = signedBy.bech32();
        let dataEncoded = this.data ? Buffer.from(this.data).toString("base64") : undefined;
        let options = this.options ? this.options : undefined;

        let plainObject = {
            nonce: this.nonce,
            value: this.value,
            receiver: this.receiver,
            sender: sender,
            gasPrice: this.gasPrice,
            gasLimit: this.gasLimit,
            data: dataEncoded,
            chainID: this.chainID,
            version: this.version,
            options: options
        };

        let serialized = JSON.stringify(plainObject);
        return Buffer.from(serialized);
    }

    applySignature(signature: ISignature, signedBy: IAddress): void {
        this.sender = signedBy.bech32();
        this.signature = signature.hex();
    }

    getSignature(): ISignature {
        return new Signature(Buffer.from(this.signature, "hex"));
    }
}
