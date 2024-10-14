import { Address } from "../address";
import { IAddress } from "../interface";
import { IContractQuery } from "../networkProviders/interface";

export class MockQuery implements IContractQuery {
    caller: IAddress = Address.empty();
    address: IAddress = Address.empty();
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
