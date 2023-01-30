import BigNumber from "bignumber.js";
import { Err } from "../../errors";
import { IAddress, IGasLimit } from "../../interface";
import { utf8ToHex } from "../codec";
import { BuilderBase, IBaseArgs, IBaseConfig } from "./baseBuilder";

interface IESDTPausingConfig extends IBaseConfig {
    gasLimitPausing: IGasLimit;
    esdtContractAddress: IAddress;
}

interface IESDTPausingArgs extends IBaseArgs {
    manager: IAddress;
    tokenIdentifier: string;
    pause: boolean;
    unpause: boolean;
}

export class ESDTPausingBuilder extends BuilderBase {
    private readonly executionGasLimit: IGasLimit;
    private readonly tokenIdentifier: string;
    private readonly togglePause: boolean;

    constructor(config: IESDTPausingConfig, args: IESDTPausingArgs) {
        super(config, args);
        this.executionGasLimit = config.gasLimitPausing;

        if (args.pause == args.unpause) {
            throw new Err("Must set either 'pause' or 'unpause' (one and only one should be set).")
        }

        this.sender = args.manager;
        this.receiver = config.esdtContractAddress;
        this.tokenIdentifier = args.tokenIdentifier;
        // We only hold the value of "pause".
        this.togglePause = args.pause;
    }

    protected estimateExecutionGas(): IGasLimit {
        return this.executionGasLimit;
    }

    protected buildTransactionPayloadParts(): string[] {
        return [
            this.togglePause ? "pause" : "unPause",
            utf8ToHex(this.tokenIdentifier),
        ];
    }
}
