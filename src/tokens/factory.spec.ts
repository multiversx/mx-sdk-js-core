import { assert } from "chai";
import { Address } from "../address";
import { DefaultTokenTransactionsFactoryConfig } from "./configuration";
import { TokenTransactionsFactory } from "./factory";

describe("test builders", () => {
    it("should build issueFungible", () => {
        const factory = new TokenTransactionsFactory(new DefaultTokenTransactionsFactoryConfig("T"));

        const transaction = factory.issueFungible({
            issuer: Address.fromBech32("erd1kdl46yctawygtwg2k462307dmz2v55c605737dp3zkxh04sct7asqylhyv"),
            tokenName: "FRANK",
            tokenTicker: "FRANK",
            initialSupply: 100,
            numDecimals: 0,
            canFreeze: true,
            canWipe: true,
            canPause: true,
            canMint: true,
            canBurn: true,
            canChangeOwner: true,
            canUpgrade: true,
            canAddSpecialRoles: true,
            nonce: 42
        });

        assert.equal(transaction.getData().toString(), "issue@4652414e4b@4652414e4b@64@00@63616e467265657a65@74727565@63616e57697065@74727565@63616e5061757365@74727565@63616e4d696e74@74727565@63616e4275726e@74727565@63616e4368616e67654f776e6572@74727565@63616e55706772616465@74727565@63616e4164645370656369616c526f6c6573@74727565")
        assert.equal(transaction.getNonce(), 42);
        assert.equal(transaction.getSender().toString(), "erd1kdl46yctawygtwg2k462307dmz2v55c605737dp3zkxh04sct7asqylhyv");
        assert.equal(transaction.getReceiver().toString(), "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u");
    });

    it("should build ESDT local burn", () => {

    });
});
