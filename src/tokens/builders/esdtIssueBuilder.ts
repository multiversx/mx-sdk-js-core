import BigNumber from "bignumber.js";
import { bigIntToBuffer, stringToBuffer } from "../codec";
import { ESDT_CONTRACT_ADDRESS } from "../constants";
import { IAddress, IESDTIssueBuilderConstructorOptions, IGasLimit, IPlainTransactionObject } from "../interface";
import { BuilderBase } from "./baseBuilder";

export class ESDTIssueBuilder extends BuilderBase {
    public readonly issuer: IAddress;
    public readonly tokenName: string;
    public readonly tokenTicker: string;
    public readonly initialSupply: BigNumber.Value;
    public readonly numDecimals: number;

    public readonly canFreeze?: boolean;
    public readonly canWipe?: boolean;
    public readonly canPause?: boolean;
    public readonly canMint?: boolean;
    public readonly canBurn?: boolean;
    public readonly canChangeOwner?: boolean;
    public readonly canUpgrade?: boolean;
    public readonly canAddSpecialRoles?: boolean;

    constructor(options: IESDTIssueBuilderConstructorOptions) {
        super(options);

        this.issuer = options.issuer;
        this.tokenName = options.tokenName;
        this.tokenTicker = options.tokenTicker;
        this.initialSupply = options.initialSupply;
        this.numDecimals = options.numDecimals;

        this.canFreeze = options.canFreeze;
        this.canWipe = options.canWipe;
        this.canPause = options.canPause;
        this.canMint = options.canMint;
        this.canBurn = options.canBurn;
        this.canChangeOwner = options.canChangeOwner;
        this.canUpgrade = options.canUpgrade;
        this.canAddSpecialRoles = options.canAddSpecialRoles;

        
    }

    protected getDefaultGasLimit(): IGasLimit {
        return this.getConfiguration().GasLimitESDTIssue;
    }

    getFunctionName(): string {
        return "issue";
    }

    protected partiallyBuildPlainTransaction(): Partial<IPlainTransactionObject> {
        return {
            value: this.getConfiguration().IssueCost.toString(),
            sender: this.issuer.toString(),
            receiver: ESDT_CONTRACT_ADDRESS
        };
    }

    buildArguments(): Buffer[] {
        const trueBuffer = stringToBuffer("true")

        return [
            stringToBuffer(this.tokenName),
            stringToBuffer(this.tokenTicker),
            bigIntToBuffer(this.initialSupply),
            bigIntToBuffer(this.numDecimals),
            ...(this.canFreeze ? [stringToBuffer("canFreeze"), trueBuffer] : []),
            ...(this.canWipe ? [stringToBuffer("canWipe"), trueBuffer] : []),
            ...(this.canPause ? [stringToBuffer("canPause"), trueBuffer] : []),
            ...(this.canMint ? [stringToBuffer("canMint"), trueBuffer] : []),
            ...(this.canBurn ? [stringToBuffer("canBurn"), trueBuffer] : []),
            ...(this.canChangeOwner ? [stringToBuffer("canChangeOwner"), trueBuffer] : []),
            ...(this.canUpgrade ? [stringToBuffer("canUpgrade"), trueBuffer] : []),
            ...(this.canAddSpecialRoles ? [stringToBuffer("canAddSpecialRoles"), trueBuffer] : []),
        ];
    }
}
