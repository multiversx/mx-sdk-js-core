import { stringToBuffer } from "../codec";
import { ESDT_CONTRACT_ADDRESS } from "../constants";
import { Err } from "../errors";
import { IAddress, IESDTPausingBuilderConstructorOptions, IGasLimit, IPlainTransactionObject, ITokenIdentifier } from "../interface";
import { BuilderBase } from "./baseBuilder";

export class ESDTPausingBuilder extends BuilderBase {
    public readonly managerAddress: IAddress;
    public readonly tokenIdentifier: ITokenIdentifier;
    public readonly togglePause: boolean;

    constructor(options: IESDTPausingBuilderConstructorOptions) {
        super(options);

        if (options.pause == options.unpause) {
            throw new Err("Must set either 'pause' or 'unpause' (one and only one should be set).")
        }

        this.managerAddress = options.managerAddress;
        this.tokenIdentifier = options.tokenIdentifier;

        // We only hold the value of "pause".
        this.togglePause = options.pause;
    }

    protected getDefaultGasLimit(): IGasLimit {
        return this.getConfiguration().GasLimitPausing;
    }

    getFunctionName(): string {
        return this.togglePause ? "pause" : "unPause";
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
            stringToBuffer(this.tokenIdentifier.valueOf())
        ];
    }
}
