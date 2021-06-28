import { Address, ContractWrapper, createBalanceBuilder, Egld, ESDTToken, setupInteractive, SystemWrapper, TokenType } from "../..";
import { MockProvider, setupUnitTestWatcherTimeouts, TestWallet } from "../../testutils";
import { assert } from "chai";

describe("test ESDT transfers via the smart contract wrapper", async function () {
    let dummyAddress = new Address("erd1qqqqqqqqqqqqqpgqak8zt22wl2ph4tswtyc39namqx6ysa2sd8ss4xmlj3");
    let provider = new MockProvider();
    let erdSys: SystemWrapper;
    let alice: TestWallet;
    let market: ContractWrapper;
    before(async function () {
        ({ erdSys, wallets: { alice } } = await setupInteractive(provider));
        market = await erdSys.loadWrapper("src/testdata", "esdt-nft-marketplace");
        market.address(dummyAddress).sender(alice).gas(500_000);
    });

    it("calling ", async function () {
        setupUnitTestWatcherTimeouts();

        let minBid = 100;
        let maxBid = 500;
        let deadline = 1_000_000;
        let acceptedToken = "TEST-1234";
        let acceptedTokenNonce = 5_000;

        let egldCallBuffers = market.value(Egld(0.5)).format.auctionToken(minBid, maxBid, deadline, acceptedToken, acceptedTokenNonce).toCallBuffers();
        assert.deepEqual(callBuffersToStrings(egldCallBuffers), ["auctionToken", "64", "01f4", "0f4240", "544553542d31323334", "1388"]);

        let MyNFT = createBalanceBuilder(new ESDTToken({ token: "TEST-1234", decimals: 0, type: TokenType.NonFungibleESDT }));
        let nonFungibleCallBuffers = market.value(MyNFT.nonce(1000).one()).format.auctionToken(minBid, maxBid, deadline, acceptedToken, acceptedTokenNonce).toCallBuffers();
        assert.deepEqual(callBuffersToStrings(nonFungibleCallBuffers), [
            "ESDTNFTTransfer",
            "544553542d31323334",
            "03e8",
            "01",
            "00000000000000000500ed8e25a94efa837aae0e593112cfbb01b448755069e1",
            "61756374696f6e546f6b656e",
            "64",
            "01f4",
            "0f4240",
            "544553542d31323334",
            "1388"
        ]);
    });
});

function callBuffersToStrings(values: Buffer[]): string[] {
    let [func, ...args] = values;
    return [func.toString(), ...argBuffersToStrings(args)];
}

function argBuffersToStrings(values: Buffer[]): string[] {
    return values.map(buffer => buffer.toString("hex"));
}
