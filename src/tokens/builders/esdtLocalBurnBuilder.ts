import BigNumber from "bignumber.js";
import { bigIntToBuffer, stringToBuffer } from "../codec";
import { IAddress, IESDTLocalBurnBuilderConstructorOptions, IGasLimit, IPlainTransactionObject, ITokenIdentifier } from "../interface";
import { BuilderBase } from "./baseBuilder";

export class ESDTLocalBurnBuilder extends BuilderBase {
    public readonly managerAddress: IAddress;
    public readonly tokenIdentifier: ITokenIdentifier;
    public readonly supplyToBurn: BigNumber.Value;

    constructor(options: IESDTLocalBurnBuilderConstructorOptions) {
        super(options);

        this.managerAddress = options.managerAddress;
        this.tokenIdentifier = options.tokenIdentifier;
        this.supplyToBurn = options.supplyToBurn;
    }

    protected getDefaultGasLimit(): IGasLimit {
        return this.getConfiguration().GasLimitESDTLocalBurn;
    }

    getFunctionName(): string {
        return "ESDTLocalBurn";
    }

    protected partiallyBuildPlainTransaction(): Partial<IPlainTransactionObject> {
        return {
            value: "0",
            sender: this.managerAddress.toString(),
            receiver: this.managerAddress.toString()
        };
    }

    buildArguments(): Buffer[] {
        return [
            stringToBuffer(this.tokenIdentifier.valueOf()),
            bigIntToBuffer(this.supplyToBurn)
        ];
    }
}
