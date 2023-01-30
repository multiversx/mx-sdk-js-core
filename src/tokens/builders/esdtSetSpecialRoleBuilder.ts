import BigNumber from "bignumber.js";
import { IAddress, IGasLimit } from "../../interface";
import { addressToHex, utf8ToHex } from "../codec";
import { BuilderBase, IBaseBuilderConstructorOptions, IBuilderBaseConfiguration } from "./baseBuilder";



interface IESDTSetSpecialRoleConfiguration extends IBuilderBaseConfiguration {
    gasLimitSetSpecialRole: IGasLimit;
    issueCost: BigNumber.Value;
    esdtContractAddress: IAddress;
}

interface IESDTSetSpecialRoleBuilderConstructorOptions extends IBaseBuilderConstructorOptions {
    manager: IAddress;
    user: IAddress;
    tokenIdentifier: string;
    addRoleLocalMint: boolean;
    addRoleLocalBurn: boolean;
}


export class ESDTSetSpecialRoleBuilder extends BuilderBase {
    private readonly executionGasLimit: IGasLimit;
    private readonly user: IAddress;
    private readonly tokenIdentifier: string;
    private readonly addRoleLocalMint: boolean;
    private readonly addRoleLocalBurn: boolean;

    constructor(config: IESDTSetSpecialRoleConfiguration, options: IESDTSetSpecialRoleBuilderConstructorOptions) {
        super(config, options);

        this.executionGasLimit = config.gasLimitSetSpecialRole;
        this.sender = options.manager;
        this.user = options.user;
        this.tokenIdentifier = options.tokenIdentifier;
        this.addRoleLocalMint = options.addRoleLocalMint;
        this.addRoleLocalBurn = options.addRoleLocalBurn;
    }

    protected estimateExecutionGas(): IGasLimit {
        return this.executionGasLimit;
    }

    protected buildTransactionPayloadParts(): string[] {
        return [
            "setSpecialRole",
            utf8ToHex(this.tokenIdentifier),
            addressToHex(this.user),
            ...(this.addRoleLocalMint ? [utf8ToHex("ESDTRoleLocalMint")] : []),
            ...(this.addRoleLocalBurn ? [utf8ToHex("ESDTRoleLocalBurn")] : []),
        ]
    }
}
