import { Address } from "../address";
import { IAddress } from "../interface";
import { IContractQuery } from "../networkProviders/interface";

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
