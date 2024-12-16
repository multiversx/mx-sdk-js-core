import { Address } from "../address";
import { IContractQuery } from "../networkProviders/interface";

export class MockQuery implements IContractQuery {
    caller = Address.empty();
    address = Address.empty();
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
