import { UserAddress } from "../address";
import { stringToBuffer } from "../codec";
import { ESDT_CONTRACT_ADDRESS } from "../constants";
import { Err } from "../errors";
import { IAddress, IESDTFreezingBuilderConstructorOptions, IGasLimit, IPlainTransactionObject, ITokenIdentifier } from "../interface";
import { BuilderBase } from "./baseBuilder";

export class ESDTFreezingBuilder extends BuilderBase {
    public readonly managerAddress: IAddress;
    public readonly userAddress: IAddress;
    public readonly tokenIdentifier: ITokenIdentifier;
    public readonly toggleFreeze: boolean;

    constructor(options: IESDTFreezingBuilderConstructorOptions) {
        super(options);

        if (options.freeze == options.unfreeze) {
            throw new Err("Must set either 'freeze' or 'unfreeze' (one and only one should be set).")
        }

        this.managerAddress = options.managerAddress;
        this.userAddress = options.userAddress;
        this.tokenIdentifier = options.tokenIdentifier;

        // We only hold the value of "freeze".
        this.toggleFreeze = options.freeze;
    }

    protected getDefaultGasLimit(): IGasLimit {
        return this.getConfiguration().GasLimitFreezing;
    }

    getFunctionName(): string {
        return this.toggleFreeze ? "freeze" : "unFreeze";
    }

    protected partiallyBuildPlainTransaction(): Partial<IPlainTransactionObject> {
        return {
            value: "0",
            sender: this.managerAddress.toString(),
            receiver: ESDT_CONTRACT_ADDRESS
        };
    }

    buildArguments(): Buffer[] {
        return [
            stringToBuffer(this.tokenIdentifier.valueOf()),
            UserAddress.fromBech32(this.userAddress.toString()).pubkey(),
        ];
    }
}
