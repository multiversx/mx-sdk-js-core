import BigNumber from "bignumber.js";
import { IAddress, IGasLimit } from "../../interface";
import { bigIntToHex, utf8ToHex } from "../codec";
import { BuilderBase, IBaseArgs, IBaseConfig } from "./baseBuilder";


interface IESDTIssueConfig extends IBaseConfig {
    gasLimitESDTIssue: IGasLimit;
    issueCost: BigNumber.Value;
    esdtContractAddress: IAddress;
}

interface IESDTIssueArgs extends IBaseArgs {
    issuer: IAddress;
    tokenName: string;
    tokenTicker: string;
    initialSupply: number;
    numDecimals: number;
    canFreeze: boolean;
    canWipe: boolean;
    canPause: boolean;
    canMint: boolean;
    canBurn: boolean;
    canChangeOwner: boolean;
    canUpgrade: boolean;
    canAddSpecialRoles: boolean;
}

export class ESDTIssueBuilder extends BuilderBase {
    private readonly executionGasLimit: IGasLimit;

    private readonly tokenName: string;
    private readonly tokenTicker: string;
    private readonly initialSupply: BigNumber.Value;
    private readonly numDecimals: number;

    private readonly canFreeze: boolean;
    private readonly canWipe: boolean;
    private readonly canPause: boolean;
    private readonly canMint: boolean;
    private readonly canBurn: boolean;
    private readonly canChangeOwner: boolean;
    private readonly canUpgrade: boolean;
    private readonly canAddSpecialRoles: boolean;

    constructor(config: IESDTIssueConfig, args: IESDTIssueArgs) {
        super(config, args);
        this.executionGasLimit = config.gasLimitESDTIssue;

        this.sender = args.issuer;
        this.receiver = config.esdtContractAddress;
        this.value = config.issueCost;

        this.tokenName = args.tokenName;
        this.tokenTicker = args.tokenTicker;
        this.initialSupply = args.initialSupply;
        this.numDecimals = args.numDecimals;

        this.canFreeze = args.canFreeze;
        this.canWipe = args.canWipe;
        this.canPause = args.canPause;
        this.canMint = args.canMint;
        this.canBurn = args.canBurn;
        this.canChangeOwner = args.canChangeOwner;
        this.canUpgrade = args.canUpgrade;
        this.canAddSpecialRoles = args.canAddSpecialRoles;
    }

    protected estimateExecutionGas(): IGasLimit {
        return this.executionGasLimit;
    }

    protected buildTransactionPayloadParts(): string[] {
        const trueAsHex = utf8ToHex("true");

        return [
            "issue",
            utf8ToHex(this.tokenName),
            utf8ToHex(this.tokenTicker),
            bigIntToHex(this.initialSupply),
            bigIntToHex(this.numDecimals),
            ...(this.canFreeze ? [utf8ToHex("canFreeze"), trueAsHex] : []),
            ...(this.canWipe ? [utf8ToHex("canWipe"), trueAsHex] : []),
            ...(this.canPause ? [utf8ToHex("canPause"), trueAsHex] : []),
            ...(this.canMint ? [utf8ToHex("canMint"), trueAsHex] : []),
            ...(this.canBurn ? [utf8ToHex("canBurn"), trueAsHex] : []),
            ...(this.canChangeOwner ? [utf8ToHex("canChangeOwner"), trueAsHex] : []),
            ...(this.canUpgrade ? [utf8ToHex("canUpgrade"), trueAsHex] : []),
            ...(this.canAddSpecialRoles ? [utf8ToHex("canAddSpecialRoles"), trueAsHex] : []),
        ];
    }
}
