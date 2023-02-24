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

    constructor(init?: Partial<TestTransaction>) {
        Object.assign(this, init);
    }

    serializeForSigning(): Buffer {
        const dataEncoded = this.data ? Buffer.from(this.data).toString("base64") : undefined;
        const options = this.options ? this.options : undefined;

        const plainObject = {
            nonce: this.nonce,
            value: this.value,
            receiver: this.receiver,
            sender: this.sender,
            gasPrice: this.gasPrice,
            gasLimit: this.gasLimit,
            data: dataEncoded,
            chainID: this.chainID,
            version: this.version,
            options: options
        };

        const serialized = JSON.stringify(plainObject);
        return Buffer.from(serialized);
    }
}
