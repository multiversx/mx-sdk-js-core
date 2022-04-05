import { BigNumber } from "bignumber.js";
import { Address, Nonce } from "./primitives";
import { IAddress, IFungibleTokenOfAccountOnNetwork, INonce, INonFungibleTokenOfAccountOnNetwork } from "./interface";

export class FungibleTokenOfAccountOnNetwork implements IFungibleTokenOfAccountOnNetwork {
    identifier: string = "";
    balance: BigNumber = new BigNumber(0);

    static fromHttpResponse(payload: any): FungibleTokenOfAccountOnNetwork {
        let result = new FungibleTokenOfAccountOnNetwork();

        result.identifier = payload.tokenIdentifier || payload.identifier || "";
        result.balance = new BigNumber(payload.balance || 0);

        return result;
    }
}

export class NonFungibleTokenOfAccountOnNetwork implements INonFungibleTokenOfAccountOnNetwork {
    identifier: string = "";
    collection: string = "";
    attributes: Buffer = Buffer.from([]);
    balance: BigNumber = new BigNumber(0);
    nonce: INonce = new Nonce(0);
    creator: IAddress = new Address("");
    royalties: BigNumber = new BigNumber(0);

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

    private static fromHttpResponse(payload: any): NonFungibleTokenOfAccountOnNetwork {
        let result = new NonFungibleTokenOfAccountOnNetwork();

        result.attributes = Buffer.from(payload.attributes || "", "base64");
        result.balance = new BigNumber(payload.balance || 1);
        result.nonce = new Nonce(payload.nonce || 0);
        result.creator = new Address(payload.creator || "");
        result.royalties = new BigNumber(payload.royalties || 0);

        return result;
    }

    private static parseCollectionFromIdentifier(identifier: string): string {
        let parts = identifier.split("-");
        let collection = parts.slice(0, 2).join("-");
        return collection;
    }
}
