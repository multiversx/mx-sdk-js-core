import BigNumber from "bignumber.js";
import { Address } from "./address";

export enum TokenType {
    Fungible,
    Semifungible,
    Nonfungible
}

export class Token {
    identifier: string = ''; // Token identifier (ticker + random string, eg. MYTOKEN-12345)
    name: string = ''; // Token name (eg. MyTokenName123)
    type: TokenType = TokenType.Fungible;
    owner: Address = new Address();
    supply: number = 0; // Circulating supply = initial minted supply + local mints - local burns
    decimals: number = 18;
    isPaused: boolean = false;
    canUpgrade: boolean = false;
    canMint: boolean = false;
    canBurn: boolean = false;
    canChangeOwner: boolean = false;
    canPause: boolean = false;
    canFreeze: boolean = false;
    canWipe: boolean = false;
    canAddSpecialRoles: boolean = false;
    canTransferNftCreateRole: boolean = false;
    nftCreateStopped: boolean = false;
    wiped: boolean = false;

    constructor(init?: Partial<Token>) {
        Object.assign(this, init);
    }

    static fromHttpResponse(response: {
        identifier: string,
        name: string,
        type: string,
        owner: string,
        supply: number,
        decimals: number,
        isPaused: boolean,
        canUpgrade: boolean,
        canMint: boolean,
        canBurn: boolean,
        canChangeOwner: boolean,
        canPause: boolean,
        canFreeze: boolean,
        canWipe: boolean
    }): Token {
        return new Token({
            identifier: response.identifier,
            name: response.name,
            type: TokenType[response.type as keyof typeof TokenType],
            owner: new Address(response.owner),
            supply: response.supply,
            decimals: response.decimals,
            isPaused: response.isPaused,
            canUpgrade: response.canUpgrade,
            canMint: response.canMint,
            canBurn: response.canBurn,
            canChangeOwner: response.canChangeOwner,
            canPause: response.canPause,
            canFreeze: response.canFreeze,
            canWipe: response.canWipe,
        });
    }

    static fromTokenProperties(tokenIdentifier: string, results: any[]): Token {
        let [tokenName, tokenType, owner, supply, ...propertiesBuffers] = results;
        let properties = parseTokenProperties(propertiesBuffers);
        return new Token({
            identifier: tokenIdentifier,
            type: TokenType[tokenType.toString() as keyof typeof TokenType],
            name: tokenName.toString(),
            owner,
            supply: supply,
            decimals: properties.NumDecimals.toNumber(),
            isPaused: properties.IsPaused,
            canUpgrade: properties.CanUpgrade,
            canMint: properties.CanMint,
            canBurn: properties.CanBurn,
            canChangeOwner: properties.CanChangeOwner,
            canPause: properties.CanPause,
            canFreeze: properties.CanFreeze,
            canWipe: properties.CanWipe,
            canAddSpecialRoles: properties.CanAddSpecialRoles,
            canTransferNftCreateRole: properties.CanTransferNFTCreateRole,
            nftCreateStopped: properties.NFTCreateStopped,
            wiped: properties.NumWiped
        });
    }

    getTokenName(): string {
        return this.name;
    }

    typeAsString(): string {
        return TokenType[this.type];
    }

    getTokenIdentifier(): string {
        return this.identifier;
    }

    isEgld(): boolean {
        return this.getTokenIdentifier() == "EGLD";
    }

    isFungible(): boolean {
        return !this.isNft();
    }

    isNft(): boolean {
        switch (this.type) {
            case TokenType.Fungible:
                return false;
            case TokenType.Semifungible:
            case TokenType.Nonfungible:
                return true;
        }
    }
}

function parseValue(value: string): any {
    switch (value) {
        case "true": return true;
        case "false": return false;
        default: return new BigNumber(value);
    }
}

function parseTokenProperties(propertiesBuffers: Buffer[]): Record<string, any> {
    let properties: Record<string, any> = {};
    for (let buffer of propertiesBuffers) {
        let [name, value] = buffer.toString().split("-");
        properties[name] = parseValue(value);
    }
    return properties;
}
