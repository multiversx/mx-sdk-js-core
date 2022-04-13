import { assert } from "chai";
import { Address } from "./primitives";

describe("test primitives", function () {
    it("should create address from bech32 and from pubkey", async function () {
        let aliceBech32 = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
        let bobBech32 = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";
        let alicePubkey = Buffer.from("0139472eff6886771a982f3083da5d421f24c29181e63888228dc81ca60d69e1", "hex");
        let bobPubkey = Buffer.from("8049d639e5a6980d1cd2392abcce41029cda74a1563523a202f09641cc2618f8", "hex");

        assert.equal(new Address(aliceBech32).bech32(), Address.fromPubkey(alicePubkey).bech32());
        assert.equal(new Address(bobBech32).bech32(), Address.fromPubkey(bobPubkey).bech32());
    });
});

