import { BigNumber } from "bignumber.js";
import { Address } from "../address";
import { IFungibleTokenOfAccountOnNetwork, INonFungibleTokenOfAccountOnNetwork } from "../interface.networkProvider";
import { Nonce } from "../nonce";

export class FungibleTokenOfAccountOnNetwork implements IFungibleTokenOfAccountOnNetwork {
    tokenIdentifier: string = "";
    balance: BigNumber = new BigNumber(0);
    
    static fromHttpResponse(payload: any): FungibleTokenOfAccountOnNetwork {
        let result = new FungibleTokenOfAccountOnNetwork();

        result.tokenIdentifier = payload.tokenIdentifier || payload.identifier || "";
        result.balance = new BigNumber(payload.balance || 0);

        return result;
    }
}

export class NonFungibleTokenOfAccountOnNetwork implements INonFungibleTokenOfAccountOnNetwork {
    tokenIdentifier: string = "";
    collection: string = "";
    attributes: Buffer = Buffer.from([]);
    balance: BigNumber = new BigNumber(0);
    nonce: Nonce = new Nonce(0);
    creator: Address = new Address("");
    royalties: BigNumber = new BigNumber(0);

    static fromProxyHttpResponse(payload: any): NonFungibleTokenOfAccountOnNetwork {
        let result = new NonFungibleTokenOfAccountOnNetwork();

        result.tokenIdentifier = payload.tokenIdentifier || "";
        result.collection = NonFungibleTokenOfAccountOnNetwork.parseCollectionFromIdentifier(result.tokenIdentifier);
        result.attributes = Buffer.from(payload.attributes || "", "base64");
        result.balance = new BigNumber(payload.balance || 0);
        result.nonce = new Nonce(payload.nonce || 0);
        result.creator = new Address(payload.creator || "");
        result.royalties = new BigNumber(payload.royalties || 0).div(100);

        return result;
    }

    private static parseCollectionFromIdentifier(identifier: string): string {
        let parts = identifier.split("-");
        let collection = parts.slice(0, 2).join("-");
        return collection;
    }

    static fromApiHttpResponse(payload: any): NonFungibleTokenOfAccountOnNetwork {
        let result = new NonFungibleTokenOfAccountOnNetwork();

        result.tokenIdentifier = payload.identifier || "";
        result.collection = payload.collection || "";
        result.attributes = Buffer.from(payload.attributes || "", "base64");
        // On API, missing balance means NFT.
        result.balance = new BigNumber(payload.balance || 1);
        result.nonce = new Nonce(payload.nonce || 0);
        result.creator = new Address(payload.creator || "");
        result.royalties = new BigNumber(payload.royalties || 0);

        return result;
    }
}
