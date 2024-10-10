/**
 * A dummy message used in tests.
 */
export class TestMessage {
    foo: string = "";
    bar: string = "";

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
}
