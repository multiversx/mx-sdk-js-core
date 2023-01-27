import BigNumber from "bignumber.js";
import { bigIntToBuffer, stringToBuffer } from "../codec";
import { IAddress, IESDTLocalMintBuilderConstructorOptions, IGasLimit, IPlainTransactionObject, ITokenIdentifier } from "../interface";
import { BuilderBase } from "./baseBuilder";

export class ESDTLocalMintBuilder extends BuilderBase {
    public readonly managerAddress: IAddress;
    public readonly tokenIdentifier: ITokenIdentifier;
    public readonly supplyToMint: BigNumber.Value;

    constructor(options: IESDTLocalMintBuilderConstructorOptions) {
        super(options);

        this.managerAddress = options.managerAddress;
        this.tokenIdentifier = options.tokenIdentifier;
        this.supplyToMint = options.supplyToMint;
    }

    protected getDefaultGasLimit(): IGasLimit {
        return this.getConfiguration().GasLimitESDTLocalMint;
    }

    getFunctionName(): string {
        return "ESDTLocalMint";
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
            bigIntToBuffer(this.supplyToMint)
        ];
    }
}
