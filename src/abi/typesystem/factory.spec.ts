import { assert } from "chai";
import { Address } from "../../core/address";
import { AddressType } from "./address";
import { createListOfAddresses, createListOfTokenIdentifiers } from "./factory";
import { ListType } from "./generic";
import { TokenIdentifierType } from "./tokenIdentifier";

describe("test factory", () => {
    it("should create lists of addresses", () => {
        let addresses = [
            new Address("erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha"),
            new Address("erd1r69gk66fmedhhcg24g2c5kn2f2a5k4kvpr6jfw67dn2lyydd8cfswy6ede"),
            new Address("erd1fggp5ru0jhcjrp5rjqyqrnvhr3sz3v2e0fm3ktknvlg7mcyan54qzccnan"),
        ];

        let list = createListOfAddresses(addresses);
        assert.deepEqual(list.getType(), new ListType(new AddressType()));
        assert.deepEqual(list.valueOf(), addresses);
    });

    it("should create lists of token identifiers", () => {
        let identifiers = ["RIDE-7d18e9", "MEX-455c57"];
        let list = createListOfTokenIdentifiers(identifiers);
        assert.deepEqual(list.getType(), new ListType(new TokenIdentifierType()));
        assert.deepEqual(list.valueOf(), identifiers);
    });
});
