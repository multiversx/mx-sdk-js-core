import { BigNumber } from "bignumber.js";
import { Bech32Address } from "./primitives";
import { IBech32Address } from "./interface";

export class DefinitionOfFungibleTokenOnNetwork {
    identifier: string = "";
    name: string = "";
    ticker: string = "";
    owner: IBech32Address = new Bech32Address("");
    decimals: number = 0;
    supply: BigNumber = new BigNumber(0);
    isPaused: boolean = false;
    canUpgrade: boolean = false;
    canMint: boolean = false;
    canBurn: boolean = false;
    canChangeOwner: boolean = false;
    canPause: boolean = false;
    canFreeze: boolean = false;
    canWipe: boolean = false;
    canAddSpecialRoles: boolean = false;

    static fromApiHttpResponse(payload: any): DefinitionOfFungibleTokenOnNetwork {
        let result = new DefinitionOfFungibleTokenOnNetwork();

        result.identifier = payload.identifier || "";
        result.name = payload.name || "";
        result.ticker = payload.ticker || "";
        result.owner = new Bech32Address(payload.owner || "");
        result.decimals = payload.decimals || 0;
        result.supply = new BigNumber(payload.supply || "0");
        result.isPaused = payload.isPaused || false;
        result.canUpgrade = payload.canUpgrade || false;
        result.canMint = payload.canMint || false;
        result.canBurn = payload.canBurn || false;
        result.canChangeOwner = payload.canChangeOwner || false;
        result.canPause = payload.canPause || false;
        result.canFreeze = payload.canFreeze || false;
        result.canWipe = payload.canWipe || false;
        result.canAddSpecialRoles = payload.canAddSpecialRoles || false;

        return result;
    }
}

export class DefinitionOfTokenCollectionOnNetwork {
    collection: string = "";
    type: string = "";
    name: string = "";
    ticker: string = "";
    owner: IBech32Address = new Bech32Address("");
    decimals: number = 0;
    canPause: boolean = false;
    canFreeze: boolean = false;
    canWipe: boolean = false;
    canTransferRole: boolean = false;

    static fromApiHttpResponse(payload: any): DefinitionOfTokenCollectionOnNetwork {
        let result = new DefinitionOfTokenCollectionOnNetwork();

        result.collection = payload.collection || "";
        result.type = payload.type || "";
        result.name = payload.name || "";
        result.ticker = payload.ticker || "";
        result.owner = new Bech32Address(payload.owner || "");
        result.decimals = payload.decimals || 0;
        result.canPause = payload.canPause || false;
        result.canFreeze = payload.canFreeze || false;
        result.canWipe = payload.canWipe || false;
        result.canTransferRole = payload.canTransferRole || false;

        return result;
    }
}
