import { Address } from "../core/address";
import { ArgSerializer } from "./argSerializer";
import { IContractFunction } from "./interface";
import { TypedValue } from "./typesystem";

export class Query {
    caller: Address;
    address: Address;
    func: IContractFunction;
    args: TypedValue[];
    value: bigint;

    constructor(obj: {
        caller?: Address;
        address: Address;
        func: IContractFunction;
        args?: TypedValue[];
        value?: bigint;
    }) {
        this.caller = obj.caller || Address.empty();
        this.address = obj.address;
        this.func = obj.func;
        this.args = obj.args || [];
        this.value = obj.value || 0n;
    }

    getEncodedArguments(): string[] {
        return new ArgSerializer().valuesToStrings(this.args);
    }
}
