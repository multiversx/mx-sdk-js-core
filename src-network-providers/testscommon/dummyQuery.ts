import { IBech32Address, IContractQuery } from "../interface";
import { Bech32Address } from "../primitives";

export class MockQuery implements IContractQuery {
    caller: IBech32Address = new Bech32Address("");
    address: IBech32Address = new Bech32Address("");
    func: string = "";
    args: string[] = [];
    value: string = "";

    constructor(init?: Partial<MockQuery>) {
        Object.assign(this, init);
    }

    getEncodedArguments(): string[] {
        return this.args;
    }
}
