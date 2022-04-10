import { ContractFunction } from "./function";
import { Balance } from "../balance";
import { Address } from "../address";
import { TypedValue } from "./typesystem";
import { ArgSerializer } from "./argSerializer";
import { IBech32Address, ITransactionValue } from "../interface";

export class Query {
    caller: IBech32Address;
    address: IBech32Address;
    func: ContractFunction;
    args: TypedValue[];
    value: ITransactionValue;

    constructor(obj: {
        caller?: IBech32Address,
        address: IBech32Address,
        func: ContractFunction,
        args?: TypedValue[],
        value?: ITransactionValue
    }) {
        this.caller = obj.caller || new Address();
        this.address = obj.address;
        this.func = obj.func;
        this.args = obj.args || [];
        this.value = obj.value || Balance.Zero();
    }

    getEncodedArguments(): string[] {
        return new ArgSerializer().valuesToStrings(this.args);
    }
}
