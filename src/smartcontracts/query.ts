import { ContractFunction } from "./function";
import { Balance } from "../balance";
import { Address } from "../address";
import { TypedValue } from "./typesystem";
import { ArgSerializer } from "./argSerializer";
import { IAddress, ITransactionValue } from "../interface";

export class Query {
    caller: IAddress;
    address: IAddress;
    func: ContractFunction;
    args: TypedValue[];
    value: ITransactionValue;

    constructor(obj: {
        caller?: IAddress,
        address: IAddress,
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
