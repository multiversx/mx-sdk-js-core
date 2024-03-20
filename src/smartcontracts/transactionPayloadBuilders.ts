import { TransactionPayload } from "../transactionPayload";
import { guardValueIsSet } from "../utils";
import { ArgSerializer } from "./argSerializer";
import { ICode, ICodeMetadata, IContractFunction } from "./interface";
import { TypedValue } from "./typesystem";

export const WasmVirtualMachine = "0500";

/**
 * @deprecated Use {@link SmartContractTransactionsFactory} instead.
 *
 * A builder for {@link TransactionPayload} objects, to be used for Smart Contract deployment transactions.
 */
export class ContractDeployPayloadBuilder {
    private code: ICode | null = null;
    private codeMetadata: ICodeMetadata = "";
    private arguments: TypedValue[] = [];

    /**
     * Sets the code of the Smart Contract.
     */
    setCode(code: ICode): ContractDeployPayloadBuilder {
        this.code = code;
        return this;
    }

    /**
     * Sets the code metadata of the Smart Contract.
     */
    setCodeMetadata(codeMetadata: ICodeMetadata): ContractDeployPayloadBuilder {
        this.codeMetadata = codeMetadata;
        return this;
    }

    /**
     * Adds constructor (`init`) arguments.
     */
    addInitArg(arg: TypedValue): ContractDeployPayloadBuilder {
        this.arguments.push(arg);
        return this;
    }

    /**
     * Sets constructor (`init`) arguments.
     */
    setInitArgs(args: TypedValue[]): ContractDeployPayloadBuilder {
        this.arguments = args;
        return this;
    }

    /**
     * Builds the {@link TransactionPayload}.
     */
    build(): TransactionPayload {
        guardValueIsSet("code", this.code);

        let code = this.code!.toString();
        let codeMetadata = this.codeMetadata.toString();
        let data = `${code}@${WasmVirtualMachine}@${codeMetadata}`;
        data = appendArgumentsToString(data, this.arguments);

        return new TransactionPayload(data);
    }
}

/**
 * @deprecated Use {@link SmartContractTransactionsFactory} instead.
 *
 * A builder for {@link TransactionPayload} objects, to be used for Smart Contract upgrade transactions.
 */
export class ContractUpgradePayloadBuilder {
    private code: ICode | null = null;
    private codeMetadata: ICodeMetadata = "";
    private arguments: TypedValue[] = [];

    /**
     * Sets the code of the Smart Contract.
     */
    setCode(code: ICode): ContractUpgradePayloadBuilder {
        this.code = code;
        return this;
    }

    /**
     * Sets the code metadata of the Smart Contract.
     */
    setCodeMetadata(codeMetadata: ICodeMetadata): ContractUpgradePayloadBuilder {
        this.codeMetadata = codeMetadata;
        return this;
    }

    /**
     * Adds upgrade (`init`) arguments.
     */
    addInitArg(arg: TypedValue): ContractUpgradePayloadBuilder {
        this.arguments.push(arg);
        return this;
    }

    /**
     * Sets upgrade (`init`) arguments.
     */
    setInitArgs(args: TypedValue[]): ContractUpgradePayloadBuilder {
        this.arguments = args;
        return this;
    }

    /**
     * Builds the {@link TransactionPayload}.
     */
    build(): TransactionPayload {
        guardValueIsSet("code", this.code);

        let code = this.code!.toString();
        let codeMetadata = this.codeMetadata.toString();
        let data = `upgradeContract@${code}@${codeMetadata}`;
        data = appendArgumentsToString(data, this.arguments);

        return new TransactionPayload(data);
    }
}

/**
 * @deprecated Use {@link SmartContractTransactionsFactory} instead.
 *
 * A builder for {@link TransactionPayload} objects, to be used for Smart Contract execution transactions.
 */
export class ContractCallPayloadBuilder {
    private contractFunction: IContractFunction | null = null;
    private arguments: TypedValue[] = [];

    /**
     * Sets the function to be called (executed).
     */
    setFunction(contractFunction: IContractFunction): ContractCallPayloadBuilder {
        this.contractFunction = contractFunction;
        return this;
    }

    /**
     * Adds a function argument.
     */
    addArg(arg: TypedValue): ContractCallPayloadBuilder {
        this.arguments.push(arg);
        return this;
    }

    /**
     * Sets the function arguments.
     */
    setArgs(args: TypedValue[]): ContractCallPayloadBuilder {
        this.arguments = args;
        return this;
    }

    /**
     * Builds the {@link TransactionPayload}.
     */
    build(): TransactionPayload {
        guardValueIsSet("calledFunction", this.contractFunction);

        let data = this.contractFunction!.toString();
        data = appendArgumentsToString(data, this.arguments);

        return new TransactionPayload(data);
    }
}

function appendArgumentsToString(to: string, values: TypedValue[]) {
    let { argumentsString, count } = new ArgSerializer().valuesToString(values);
    if (count == 0) {
        return to;
    }
    return `${to}@${argumentsString}`;
}
