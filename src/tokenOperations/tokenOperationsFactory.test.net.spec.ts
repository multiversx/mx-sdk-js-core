import { assert } from "chai";
import { AsyncTimer } from "../asyncTimer";
import { INetworkConfig } from "../interfaceOfNetwork";
import { loadTestWallets, TestWallet } from "../testutils";
import { createTestnetProvider, INetworkProvider } from "../testutils/networkProviders";
import { TransactionWatcher } from "../transactionWatcher";
import { TokenOperationsFactory } from "./tokenOperationsFactory";
import { TokenOperationsFactoryConfig } from "./tokenOperationsFactoryConfig";
import { TokenOperationsOutcomeParser } from "./tokenOperationsOutcomeParser";

describe("test factory on testnet", function () {
    let frank: TestWallet, grace: TestWallet;
    let provider: INetworkProvider;
    let watcher: TransactionWatcher;
    let network: INetworkConfig;
    let factory: TokenOperationsFactory;
    let parser: TokenOperationsOutcomeParser;

    before(async function () {
        console.log(`> ${this.currentTest?.title} ...`);

        ({ frank, grace } = await loadTestWallets());

        provider = createTestnetProvider();
        watcher = new TransactionWatcher(provider);
        network = await provider.getNetworkConfig();
        factory = new TokenOperationsFactory(new TokenOperationsFactoryConfig(network.ChainID));
        parser = new TokenOperationsOutcomeParser();
    });

    it("should issue fungible, mint, burn", async function () {
        this.timeout(120000);
        await frank.sync(provider);
        await grace.sync(provider);

        // Issue
        const tx1 = factory.issueFungible({
            issuer: frank.address,
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
            nonce: frank.account.nonce
        });

        frank.account.incrementNonce();
        await frank.signer.sign(tx1);
        await provider.sendTransaction(tx1);
        console.log("tx1", tx1.getHash().hex());

        const tx1OnNetwork = await watcher.awaitCompleted(tx1);
        const tx1Outcome = parser.parseIssueFungible(tx1OnNetwork);
        const tokenIdentifier = tx1Outcome.tokenIdentifier;
        assert.isTrue(tokenIdentifier.includes("FRANK"));

        // Set roles (give Grace the ability to mint and burn)
        const tx2 = factory.setSpecialRoleOnFungible({
            manager: frank.address,
            user: grace.address,
            tokenIdentifier: tx1Outcome.tokenIdentifier,
            addRoleLocalMint: true,
            addRoleLocalBurn: true,
            nonce: frank.account.nonce
        });

        frank.account.incrementNonce();
        await frank.signer.sign(tx2);
        await provider.sendTransaction(tx2);
        console.log("tx2", tx2.getHash().hex());

        const tx2OnNetwork = await watcher.awaitCompleted(tx2);
        const tx2Outcome = parser.parseSetSpecialRole(tx2OnNetwork);
        assert.include(tx2Outcome.roles, "ESDTRoleLocalMint");
        assert.include(tx2Outcome.roles, "ESDTRoleLocalBurn");

        // Mint (Grace mints for herself)
        const tx3 = factory.localMint({
            manager: grace.address,
            user: grace.address,
            tokenIdentifier: tokenIdentifier,
            supplyToMint: 200,
            nonce: grace.account.nonce
        });

        grace.account.incrementNonce();
        await grace.signer.sign(tx3);
        await provider.sendTransaction(tx3);
        console.log("tx3", tx3.getHash().hex());

        const tx3OnNetwork = await watcher.awaitCompleted(tx3);
        const tx3Outcome = parser.parseLocalMint(tx3OnNetwork);
        assert.equal(tx3Outcome.mintedSupply, "200");

        // Burn (Grace burns 50 of her tokens)
        const tx4 = factory.localBurn({
            manager: grace.address,
            user: grace.address,
            tokenIdentifier: tokenIdentifier,
            supplyToBurn: 50,
            nonce: grace.account.nonce
        });

        grace.account.incrementNonce();
        await grace.signer.sign(tx4);
        await provider.sendTransaction(tx4);
        console.log("tx4", tx4.getHash().hex());

        const tx4OnNetwork = await watcher.awaitCompleted(tx4);
        const tx4Outcome = parser.parseLocalBurn(tx4OnNetwork);
        assert.equal(tx4Outcome.burntSupply, "50");
    });

    it("should issue and create NFT", async function () {
        this.timeout(180000);
        await frank.sync(provider);
        await grace.sync(provider);

        // Issue NFT
        const tx1 = factory.issueNonFungible({
            issuer: frank.address,
            tokenName: "FRANK",
            tokenTicker: "FRANK",
            canFreeze: true,
            canWipe: true,
            canPause: true,
            canTransferNFTCreateRole: true,
            canChangeOwner: true,
            canUpgrade: true,
            canAddSpecialRoles: true,
            nonce: frank.account.nonce
        });

        frank.account.incrementNonce();
        await frank.signer.sign(tx1);
        await provider.sendTransaction(tx1);
        console.log("tx1", tx1.getHash().hex());

        const tx1OnNetwork = await watcher.awaitCompleted(tx1);
        const tx1Outcome = parser.parseIssueNonFungible(tx1OnNetwork);
        const tokenIdentifier = tx1Outcome.tokenIdentifier;
        assert.isTrue(tokenIdentifier.includes("FRANK"));

        // Set roles (give Grace the ability to create NFTs)
        const tx2 = factory.setSpecialRoleOnNonFungible({
            manager: frank.address,
            user: grace.address,
            tokenIdentifier: tokenIdentifier,
            addRoleNFTCreate: true,
            addRoleNFTBurn: false,
            addRoleNFTUpdateAttributes: true,
            addRoleNFTAddURI: true,
            addRoleESDTTransferRole: false,
            nonce: frank.account.nonce
        });

        frank.account.incrementNonce();
        await frank.signer.sign(tx2);
        await provider.sendTransaction(tx2);
        console.log("tx2", tx2.getHash().hex());

        let tx2OnNetwork = await watcher.awaitCompleted(tx2);

        // For such transactions, the "isCompleted" field is somehow incorrect (false positive).
        // Let's wait a bit more to have the outcome. 
        await (new AsyncTimer("test")).start(1000);
        tx2OnNetwork = await watcher.awaitCompleted(tx2);

        const tx2Outcome = parser.parseSetSpecialRole(tx2OnNetwork);
        assert.include(tx2Outcome.roles, "ESDTRoleNFTCreate");
        assert.include(tx2Outcome.roles, "ESDTRoleNFTUpdateAttributes");

        // Create NFTs
        for (let i = 1; i <= 3; i++) {
            const tx = factory.nftCreate({
                creator: grace.address,
                tokenIdentifier: tokenIdentifier,
                initialQuantity: 1,
                name: `test-${i}`,
                royalties: 1000,
                hash: "abba",
                attributes: "test",
                uris: ["a", "b"],
                nonce: grace.account.nonce
            });

            grace.account.incrementNonce();
            await grace.signer.sign(tx);
            await provider.sendTransaction(tx);
            console.log("tx", tx.getHash().hex());

            const txOnNetwork = await watcher.awaitCompleted(tx);
            const txOutcome = parser.parseNFTCreate(txOnNetwork);

            assert.equal(txOutcome.tokenIdentifier, tokenIdentifier);
            assert.equal(txOutcome.nonce, i);
            assert.equal(txOutcome.initialQuantity, 1);
        }
    });

    it("should issue and create SFT", async function () {
        this.timeout(180000);
        await frank.sync(provider);
        await grace.sync(provider);

        // Issue SFT
        const tx1 = factory.issueSemiFungible({
            issuer: frank.address,
            tokenName: "FRANK",
            tokenTicker: "FRANK",
            canFreeze: true,
            canWipe: true,
            canPause: true,
            canTransferNFTCreateRole: true,
            canChangeOwner: true,
            canUpgrade: true,
            canAddSpecialRoles: true,
            nonce: frank.account.nonce
        });

        frank.account.incrementNonce();
        await frank.signer.sign(tx1);
        await provider.sendTransaction(tx1);
        console.log("tx1", tx1.getHash().hex());

        const tx1OnNetwork = await watcher.awaitCompleted(tx1);
        const tx1Outcome = parser.parseIssueSemiFungible(tx1OnNetwork);
        const tokenIdentifier = tx1Outcome.tokenIdentifier;
        assert.isTrue(tokenIdentifier.includes("FRANK"));

        // Set roles (give Grace the ability to create SFTs)
        const tx2 = factory.setSpecialRoleOnSemiFungible({
            manager: frank.address,
            user: grace.address,
            tokenIdentifier: tokenIdentifier,
            addRoleNFTCreate: true,
            addRoleNFTBurn: false,
            addRoleNFTAddQuantity: true,
            addRoleESDTTransferRole: false,
            nonce: frank.account.nonce
        });

        frank.account.incrementNonce();
        await frank.signer.sign(tx2);
        await provider.sendTransaction(tx2);
        console.log("tx2", tx2.getHash().hex());

        let tx2OnNetwork = await watcher.awaitCompleted(tx2);

        // For such transactions, the "isCompleted" field is somehow incorrect (false positive).
        // Let's wait a bit more to have the outcome. 
        await (new AsyncTimer("test")).start(1000);
        tx2OnNetwork = await watcher.awaitCompleted(tx2);

        const tx2Outcome = parser.parseSetSpecialRole(tx2OnNetwork);
        assert.include(tx2Outcome.roles, "ESDTRoleNFTCreate");
        assert.include(tx2Outcome.roles, "ESDTRoleNFTAddQuantity");

        // Create SFTs
        for (let i = 1; i <= 3; i++) {
            const tx = factory.nftCreate({
                creator: grace.address,
                tokenIdentifier: tokenIdentifier,
                initialQuantity: i * 10,
                name: `test-${i}`,
                royalties: 1000,
                hash: "abba",
                attributes: "test",
                uris: ["a", "b"],
                nonce: grace.account.nonce
            });

            grace.account.incrementNonce();
            await grace.signer.sign(tx);
            await provider.sendTransaction(tx);
            console.log("tx", tx.getHash().hex());

            const txOnNetwork = await watcher.awaitCompleted(tx);
            const txOutcome = parser.parseNFTCreate(txOnNetwork);

            assert.equal(txOutcome.tokenIdentifier, tokenIdentifier);
            assert.equal(txOutcome.nonce, i);
            assert.equal(txOutcome.initialQuantity, i * 10);
        }
    });
});