import { BigNumber } from "bignumber.js";
import { Address, Nonce } from "./primitives";
import { IAddress, INonce } from "./interface";

export class FungibleTokenOfAccountOnNetwork {
    identifier: string = "";
    balance: BigNumber = new BigNumber(0);

    static fromHttpResponse(payload: any): FungibleTokenOfAccountOnNetwork {
        let result = new FungibleTokenOfAccountOnNetwork();

        result.identifier = payload.tokenIdentifier || payload.identifier || "";
        result.balance = new BigNumber(payload.balance || 0);

        return result;
    }
}

export class NonFungibleTokenOfAccountOnNetwork {
    identifier: string = "";
    collection: string = "";
    timestamp: number = 0;
    attributes: Buffer = Buffer.from([]);
    nonce: INonce = new Nonce(0);
    type: string = "";
    name: string = "";
    creator: IAddress = new Address("");
    isWhitelistedStorage: boolean = false;
    supply: BigNumber = new BigNumber(0);
    decimals: number = 0;
    royalties: BigNumber = new BigNumber(0);
    ticker: string = "";
    assets: string[] = [];

    constructor(init?: Partial<NonFungibleTokenOfAccountOnNetwork>) {
        Object.assign(this, init);
    }

    static fromProxyHttpResponse(payload: any): NonFungibleTokenOfAccountOnNetwork {
        let result = NonFungibleTokenOfAccountOnNetwork.fromHttpResponse(payload);

        result.identifier = payload.tokenIdentifier || "";
        result.collection = NonFungibleTokenOfAccountOnNetwork.parseCollectionFromIdentifier(result.identifier);
        result.royalties = new BigNumber(payload.royalties || 0).div(100);

        return result;
    }

    static fromProxyHttpResponseByNonce(payload: any): NonFungibleTokenOfAccountOnNetwork {
        let result = NonFungibleTokenOfAccountOnNetwork.fromHttpResponse(payload);

        result.identifier = `${payload.tokenIdentifier}-${result.nonce.hex()}`;
        result.collection = payload.tokenIdentifier || "";
        result.royalties = new BigNumber(payload.royalties || 0).div(100);

        return result;
    }

    static fromApiHttpResponse(payload: any): NonFungibleTokenOfAccountOnNetwork {
        let result = NonFungibleTokenOfAccountOnNetwork.fromHttpResponse(payload);

        result.identifier = payload.identifier || "";
        result.collection = payload.collection || "";

        return result;
    }

    // TODO: Compare results from Proxy and API and try to reconciliate them.
    private static fromHttpResponse(payload: any): NonFungibleTokenOfAccountOnNetwork {
        let result = new NonFungibleTokenOfAccountOnNetwork();

        result.timestamp = Number(payload.timestamp || 0);
        result.attributes = Buffer.from(payload.attributes || "", "base64");
        result.nonce = new Nonce(payload.nonce || 0);
        result.type = payload.type || "";
        result.name = payload.name || "";
        result.creator = new Address(payload.creator || "");
        result.isWhitelistedStorage = payload.isWhitelistedStorage || false;
        result.decimals = Number(payload.decimals || 0);
        result.supply = new BigNumber(payload.balance || 1);
        result.royalties = new BigNumber(payload.royalties || 0);
        result.ticker = payload.ticker || "";
        result.assets = payload.assets || [];

        return result;
    }

    private static parseCollectionFromIdentifier(identifier: string): string {
        let parts = identifier.split("-");
        let collection = parts.slice(0, 2).join("-");
        return collection;
    }
}
