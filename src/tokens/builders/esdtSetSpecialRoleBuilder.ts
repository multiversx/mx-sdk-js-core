import { addressToBuffer, stringToBuffer } from "../codec";
import { IAddress, IESDTSetSpecialRoleBuilderConstructorOptions, IGasLimit, IPlainTransactionObject, ITokenIdentifier } from "../interface";
import { BuilderBase } from "./baseBuilder";

export class ESDTSetSpecialRoleBuilder extends BuilderBase {
    public readonly managerAddress: IAddress;
    public readonly userAddress: IAddress;
    public readonly tokenIdentifier: ITokenIdentifier;
    public readonly addRoleLocalMint: boolean;
    public readonly addRoleLocalBurn: boolean;

    constructor(options: IESDTSetSpecialRoleBuilderConstructorOptions) {
        super(options);

        this.managerAddress = options.managerAddress;
        this.userAddress = options.userAddress;
        this.tokenIdentifier = options.tokenIdentifier;
        this.addRoleLocalMint = options.addRoleLocalMint;
        this.addRoleLocalBurn = options.addRoleLocalBurn;
    }

    protected getDefaultGasLimit(): IGasLimit {
        return this.getConfiguration().GasLimitSetSpecialRole;
    }

    getFunctionName(): string {
        return "setSpecialRole";
    }

    protected partiallyBuildPlainTransaction(): Partial<IPlainTransactionObject> {
        return {
            value: "0",
            sender: this.managerAddress.toString(),
            receiver: this.getConfiguration().ESDTContractAddress.toString(),
        };
    }

    buildArguments(): Buffer[] {
        return [
            stringToBuffer(this.tokenIdentifier.valueOf()),
            addressToBuffer(this.userAddress),
            ...(this.addRoleLocalMint ? [stringToBuffer("ESDTRoleLocalMint")] : []),
            ...(this.addRoleLocalBurn ? [stringToBuffer("ESDTRoleLocalBurn")] : []),
        ];
    }
}
