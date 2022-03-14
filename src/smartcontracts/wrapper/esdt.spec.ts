import { isOnBrowserTests, MockProvider, setupUnitTestWatcherTimeouts, TestWallet } from "../../testutils";
import { assert } from "chai";
import BigNumber from "bignumber.js";
import { SystemWrapper } from "./systemWrapper";
import { Address } from "../../address";
import { ContractWrapper } from "./contractWrapper";
import { setupInteractiveWithProvider } from "../../interactive";
import { createBalanceBuilder, Egld } from "../../balanceBuilder";
import { Token, TokenType } from "../../token";
import { ArgSerializer } from "../argSerializer";

describe("test ESDT transfers via the smart contract wrapper", async function () {
    let dummyAddress = new Address("erd1qqqqqqqqqqqqqpgqak8zt22wl2ph4tswtyc39namqx6ysa2sd8ss4xmlj3");
    let provider = new MockProvider();
    let erdSys: SystemWrapper;
    let alice: TestWallet;
    let market: ContractWrapper;
    before(async function () {
        if (isOnBrowserTests()) {
            this.skip();
        }

        ({ erdSys, wallets: { alice } } = await setupInteractiveWithProvider(provider));
        market = await erdSys.loadWrapper("src/testdata", "esdt-nft-marketplace");
        market.address(dummyAddress).sender(alice).gas(500_000);
    });

    it("formats the call arguments with an NFT transfer", async function () {
        setupUnitTestWatcherTimeouts();

        let minBid = 100;
        let maxBid = 500;
        let deadline = 1_000_000;
        let acceptedToken = "TEST-1234";
        let acceptedTokenNonce = 5_000;

        let egldCallBuffers = market.value(Egld(0.5)).format.auctionToken(minBid, maxBid, deadline, acceptedToken, acceptedTokenNonce).toCallBuffers();
        assert.deepEqual(callBuffersToStrings(egldCallBuffers), ["auctionToken", "64", "01f4", "0f4240", "544553542d31323334", "1388"]);

        let MyNFT = createBalanceBuilder(new Token({ identifier: "TEST-1234", decimals: 0, type: TokenType.Nonfungible }));
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
    })

    it("binary codec encodes / decodes the result of getAllAuctions", async function () {
        let definitions = market.getSmartContract().getAbi().getEndpoint("getAllAuctions").output;
        let data = "AAAAAAAAABAAAAALVEVTVC1mZWVkNjAAAAAAAAAAAQAAAAEBAQAAAARFR0xEAAAAAAAAAAAAAAAIDeC2s6dkAAABAAAACIrHIwSJ6AAAAAAAAGH5jkwAAAAAYfmYSHcAUz3KJ/38F1qkbu0H68K6R6XlPs1xLnqrL6ipWMb5AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgPoAAAAAgnE";
        let serializer = new ArgSerializer();

        const values = serializer.buffersToValues([Buffer.from(data, 'base64')], definitions);

        assert.equal(values.length, 1);
        const value = values[0].valueOf();

        const expected = Array.from([{
            field0: new BigNumber(16),
            field1: {
                auction_type: {
                    fields: [],
                    name: "Nft"
                },
                auctioned_token: {
                    nonce: new BigNumber(1),
                    token_type: Buffer.from("TEST-feed60"),
                },
                creator_royalties_percentage: new BigNumber(2500),
                current_bid: new BigNumber(0),
                current_winner: new Address("0000000000000000000000000000000000000000000000000000000000000000"),
                deadline: new BigNumber(1643747400),
                marketplace_cut_percentage: new BigNumber(1000),
                max_bid: new BigNumber("10000000000000000000"),
                min_bid: new BigNumber("1000000000000000000"),
                nr_auctioned_tokens: new BigNumber(1),
                original_owner: new Address("erd1wuq9x0w2yl7lc96653hw6pltc2ay0f098mxhztn64vh6322ccmussa83g9"),
                payment_token: {
                    nonce: new BigNumber(0),
                    token_type: Buffer.from("EGLD")
                },
                start_time: new BigNumber(1643744844)
            }
        }]);

        assert.deepEqual(value, expected);
    })
});

function callBuffersToStrings(values: Buffer[]): string[] {
    let [func, ...args] = values;
    return [func.toString(), ...argBuffersToStrings(args)];
}

function argBuffersToStrings(values: Buffer[]): string[] {
    return values.map(buffer => buffer.toString("hex"));
}
