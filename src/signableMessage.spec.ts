import { assert } from "chai";
import { SignableMessage } from "./signableMessage";
import { loadTestWallets, TestWallet } from "./testutils";


describe("test signable message", () => {
    let alice: TestWallet;
    before(async function () {
        ({ alice } = await loadTestWallets());
    });
    it("should create signableMessage", async () => {
        const sm = new SignableMessage({
            address: alice.address,
            message: Buffer.from("test message", "ascii"),
            signature: Buffer.from("a".repeat(128), "hex"),
            signer: "ElrondWallet"
        });

        const jsonSM = sm.toJSON();

        // We just test that the returned object contains what was passed and the hex values are prefixed with 0x
        assert.deepEqual(jsonSM, {
            address: 'erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th',
            message: '0x74657374206d657373616765',
            signature: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            version: 1,
            signer: 'ElrondWallet'
        }, "invalid signable message returned");
    });
});
