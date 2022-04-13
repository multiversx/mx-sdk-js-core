import { IAddress, IContractQuery } from "../interface";
import { Address } from "../primitives";

export class MockQuery implements IContractQuery {
    caller: IAddress = new Address("");
    address: IAddress = new Address("");
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
