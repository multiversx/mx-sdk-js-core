import BigNumber from "bignumber.js";
import { IAddress, IGasLimit } from "../../interface";
import { bigIntToHex, utf8ToHex } from "../codec";
import { BuilderBase, IBaseArgs, IBaseConfig } from "./baseBuilder";

interface IESDTLocalMintConfig extends IBaseConfig {
    gasLimitESDTLocalMint: IGasLimit;
}

interface IESDTLocalMintArgs extends IBaseArgs {
    manager: IAddress;
    user: IAddress;
    tokenIdentifier: string;
    supplyToMint: BigNumber.Value
}

export class ESDTLocalMintBuilder extends BuilderBase {
    private readonly executionGasLimit: IGasLimit;
    private readonly tokenIdentifier: string;
    private readonly supplyToMint: BigNumber.Value;

    constructor(config: IESDTLocalMintConfig, args: IESDTLocalMintArgs) {
        super(config, args);
        this.executionGasLimit = config.gasLimitESDTLocalMint;

        this.sender = args.manager;
        this.receiver = args.manager;
        this.tokenIdentifier = args.tokenIdentifier;
        this.supplyToMint = args.supplyToMint;
    }

    protected estimateExecutionGas(): IGasLimit {
        return this.executionGasLimit;
    }

    protected buildTransactionPayloadParts(): string[] {
        return [
            "ESDTLocalMint",
            utf8ToHex(this.tokenIdentifier),
            bigIntToHex(this.supplyToMint),
        ]
    }
}
