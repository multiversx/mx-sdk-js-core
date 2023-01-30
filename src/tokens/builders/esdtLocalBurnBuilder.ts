import BigNumber from "bignumber.js";
import { IAddress, IGasLimit } from "../../interface";
import { bigIntToHex, utf8ToHex } from "../codec";
import { BuilderBase, IBaseArgs, IBaseConfig } from "./baseBuilder";

interface IESDTLocalBurnConfig extends IBaseConfig {
    gasLimitESDTLocalBurn: IGasLimit;
}

interface IESDTLocalBurnArgs extends IBaseArgs {
    manager: IAddress;
    user: IAddress;
    tokenIdentifier: string;
    supplyToBurn: BigNumber.Value
}

export class ESDTLocalBurnBuilder extends BuilderBase {
    private readonly executionGasLimit: IGasLimit;
    private readonly tokenIdentifier: string;
    private readonly supplyToBurn: BigNumber.Value;

    constructor(config: IESDTLocalBurnConfig, args: IESDTLocalBurnArgs) {
        super(config, args);
        this.executionGasLimit = config.gasLimitESDTLocalBurn;

        this.sender = args.manager;
        this.receiver = args.manager;
        this.tokenIdentifier = args.tokenIdentifier;
        this.supplyToBurn = args.supplyToBurn;
    }

    protected estimateExecutionGas(): IGasLimit {
        return this.executionGasLimit;
    }

    protected buildTransactionPayloadParts(): string[] {
        return [
            "ESDTLocalBurn",
            utf8ToHex(this.tokenIdentifier),
            bigIntToHex(this.supplyToBurn),
        ]
    }
}
