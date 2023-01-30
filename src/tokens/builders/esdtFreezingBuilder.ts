import { Err } from "../../errors";
import { IAddress, IGasLimit } from "../../interface";
import { addressToHex, utf8ToHex } from "../codec";
import { BuilderBase, IBaseArgs, IBaseConfig } from "./baseBuilder";

interface IESDTFreezingConfig extends IBaseConfig {
    gasLimitFreezing: IGasLimit;
    esdtContractAddress: IAddress;
}

interface IESDTFreezingArgs extends IBaseArgs {
    manager: IAddress;
    user: IAddress;
    tokenIdentifier: string;
    freeze: boolean;
    unfreeze: boolean;
}

export class ESDTFreezingBuilder extends BuilderBase {
    private readonly executionGasLimit: IGasLimit;
    private readonly user: IAddress;
    private readonly tokenIdentifier: string;
    private readonly toggleFreeze: boolean;

    constructor(config: IESDTFreezingConfig, args: IESDTFreezingArgs) {
        super(config, args);
        this.executionGasLimit = config.gasLimitFreezing;

        if (args.freeze == args.unfreeze) {
            throw new Err("Must set either 'freeze' or 'unfreeze' (one and only one should be set).")
        }

        this.sender = args.manager;
        this.receiver = config.esdtContractAddress;
        this.user = args.user;
        this.tokenIdentifier = args.tokenIdentifier;
        // We only hold the value of "freeze".
        this.toggleFreeze = args.freeze;
    }

    protected estimateExecutionGas(): IGasLimit {
        return this.executionGasLimit;
    }

    protected buildTransactionPayloadParts(): string[] {
        return [
            this.toggleFreeze ? "freeze" : "unfreeze",
            utf8ToHex(this.tokenIdentifier),
            addressToHex(this.user)
        ];
    }
}
