import { Address } from "../address";
import { TypedValue } from "./typesystem";
import { ArgSerializer } from "./argSerializer";
import { IAddress, ITransactionValue } from "../interface";
import { IContractFunction } from "./interface";

export class Query {
    caller: IAddress;
    address: IAddress;
    func: IContractFunction;
    args: TypedValue[];
    value: ITransactionValue;

    constructor(obj: {
        caller?: IAddress;
        address: IAddress;
        func: IContractFunction;
        args?: TypedValue[];
        value?: ITransactionValue;
    }) {
        this.caller = obj.caller || Address.empty();
        this.address = obj.address;
        this.func = obj.func;
        this.args = obj.args || [];
        this.value = obj.value || 0;
    }

    getEncodedArguments(): string[] {
        return new ArgSerializer().valuesToStrings(this.args);
    }
}
