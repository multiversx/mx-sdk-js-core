import { assert } from "chai";
import { GasEstimator } from "../gasEstimator";
import { INetworkConfig, ITransactionOnNetwork } from "../interfaceOfNetwork";
import { loadTestWallets, TestWallet } from "../testutils";
import { createTestnetProvider, INetworkProvider } from "../testutils/networkProviders";
import { TokenTransfer } from "../tokenTransfer";
import { Transaction } from "../transaction";
import { TransactionWatcher } from "../transactionWatcher";
import { TransferTransactionsFactory } from "../transferTransactionsFactory";
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
    let transferTransactionsFactory: TransferTransactionsFactory;

    before(async function () {
        console.log(`> ${this.currentTest?.title} ...`);

        ({ frank, grace } = await loadTestWallets());

        provider = createTestnetProvider();
        watcher = new TransactionWatcher(provider, { patienceMilliseconds: 8000 });
        network = await provider.getNetworkConfig();
        factory = new TokenOperationsFactory(new TokenOperationsFactoryConfig(network.ChainID));
        parser = new TokenOperationsOutcomeParser();
        transferTransactionsFactory = new TransferTransactionsFactory(new GasEstimator());
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
            transactionNonce: frank.getNonce()
        });

        const tx1OnNetwork = await processTransaction(frank, tx1, "tx1");
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
            transactionNonce: frank.getNonce()
        });

        const tx2OnNetwork = await processTransaction(frank, tx2, "tx2");
        const tx2Outcome = parser.parseSetSpecialRole(tx2OnNetwork);
        assert.include(tx2Outcome.roles, "ESDTRoleLocalMint");
        assert.include(tx2Outcome.roles, "ESDTRoleLocalBurn");

        // Mint (Grace mints for herself)
        const tx3 = factory.localMint({
            manager: grace.address,
            user: grace.address,
            tokenIdentifier: tokenIdentifier,
            supplyToMint: 200,
            transactionNonce: grace.getNonce()
        });

        const tx3OnNetwork = await processTransaction(grace, tx3, "tx3");
        const tx3Outcome = parser.parseLocalMint(tx3OnNetwork);
        assert.equal(tx3Outcome.mintedSupply, "200");

        // Burn (Grace burns 50 of her tokens)
        const tx4 = factory.localBurn({
            manager: grace.address,
            user: grace.address,
            tokenIdentifier: tokenIdentifier,
            supplyToBurn: 50,
            transactionNonce: grace.getNonce()
        });

        const tx4OnNetwork = await processTransaction(grace, tx4, "tx4");
        const tx4Outcome = parser.parseLocalBurn(tx4OnNetwork);
        assert.equal(tx4Outcome.burntSupply, "50");
    });

    it("should issue fungible, pause, unpause", async function () {
        this.timeout(240000);
        await frank.sync(provider);

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
            transactionNonce: frank.getNonce()
        });

        const tx1OnNetwork = await processTransaction(frank, tx1, "tx1");
        const tx1Outcome = parser.parseIssueFungible(tx1OnNetwork);
        const tokenIdentifier = tx1Outcome.tokenIdentifier;
        assert.isTrue(tokenIdentifier.includes("FRANK"));

        // Pause
        const tx2 = factory.pause({
            manager: frank.address,
            tokenIdentifier: tokenIdentifier,
            transactionNonce: frank.getNonce()
        });

        const tx2OnNetwork = await processTransaction(frank, tx2, "tx2");
        const _tx2Outcome = parser.parsePause(tx2OnNetwork);

        // Unpause
        const tx3 = factory.unpause({
            manager: frank.address,
            tokenIdentifier: tokenIdentifier,
            transactionNonce: frank.getNonce()
        });

        const tx3OnNetwork = await processTransaction(frank, tx3, "tx3");
        const _tx3Outcome = parser.parseUnpause(tx3OnNetwork);

        // Send some tokens to Grace
        const tx4 = transferTransactionsFactory.createESDTTransfer({
            tokenTransfer: TokenTransfer.fungibleFromBigInteger(tokenIdentifier, 10),
            sender: frank.address,
            receiver: grace.address,
            chainID: network.ChainID,
            nonce: frank.getNonce()
        });

        const _tx4OnNetwork = await processTransaction(frank, tx4, "tx4");
    });

    it("should issue fungible, freeze, unfreeze", async function () {
        this.timeout(240000);
        await frank.sync(provider);

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
            transactionNonce: frank.getNonce()
        });

        const tx1OnNetwork = await processTransaction(frank, tx1, "tx1");
        const tx1Outcome = parser.parseIssueFungible(tx1OnNetwork);
        const tokenIdentifier = tx1Outcome.tokenIdentifier;
        assert.isTrue(tokenIdentifier.includes("FRANK"));

        // Send some tokens to Grace
        const tx2 = transferTransactionsFactory.createESDTTransfer({
            tokenTransfer: TokenTransfer.fungibleFromBigInteger(tokenIdentifier, 10),
            sender: frank.address,
            receiver: grace.address,
            chainID: network.ChainID,
            nonce: frank.getNonce()
        });

        const _tx2OnNetwork = await processTransaction(frank, tx2, "tx2");

        // Freeze
        const tx3 = factory.freeze({
            manager: frank.address,
            user: grace.address,
            tokenIdentifier: tokenIdentifier,
            transactionNonce: frank.getNonce()
        });

        const tx3OnNetwork = await processTransaction(frank, tx3, "tx3");
        const tx3Outcome = parser.parseFreeze(tx3OnNetwork);
        assert.equal(tx3Outcome.userAddress, grace.address.bech32());
        assert.equal(tx3Outcome.tokenIdentifier, tokenIdentifier);
        assert.equal(tx3Outcome.nonce, "0");
        assert.equal(tx3Outcome.balance, "10");

        // Unfreeze
        const tx4 = factory.unfreeze({
            manager: frank.address,
            user: grace.address,
            tokenIdentifier: tokenIdentifier,
            transactionNonce: frank.getNonce()
        });

        const tx4OnNetwork = await processTransaction(frank, tx4, "tx4");
        const tx4Outcome = parser.parseUnfreeze(tx4OnNetwork);
        assert.equal(tx4Outcome.userAddress, grace.address.bech32());
        assert.equal(tx4Outcome.tokenIdentifier, tokenIdentifier);
        assert.equal(tx4Outcome.nonce, "0");
        assert.equal(tx4Outcome.balance, "10");
    });

    it("should issue fungible, freeze, wipe", async function () {
        this.timeout(240000);
        await frank.sync(provider);

        // Issue
        const tx1 = factory.issueFungible({
            issuer: frank.address,
            tokenName: "FRANK",
            tokenTicker: "FRANK",
            initialSupply: "100",
            numDecimals: 0,
            canFreeze: true,
            canWipe: true,
            canPause: true,
            canMint: true,
            canBurn: true,
            canChangeOwner: true,
            canUpgrade: true,
            canAddSpecialRoles: true,
            transactionNonce: frank.getNonce()
        });

        const tx1OnNetwork = await processTransaction(frank, tx1, "tx1");
        const tx1Outcome = parser.parseIssueFungible(tx1OnNetwork);
        const tokenIdentifier = tx1Outcome.tokenIdentifier;
        assert.isTrue(tokenIdentifier.includes("FRANK"));

        // Send some tokens to Grace
        const tx2 = transferTransactionsFactory.createESDTTransfer({
            tokenTransfer: TokenTransfer.fungibleFromBigInteger(tokenIdentifier, 10),
            sender: frank.address,
            receiver: grace.address,
            chainID: network.ChainID,
            nonce: frank.getNonce()
        });

        const _tx2OnNetwork = await processTransaction(frank, tx2, "tx2");

        // Freeze
        const tx3 = factory.freeze({
            manager: frank.address,
            user: grace.address,
            tokenIdentifier: tokenIdentifier,
            transactionNonce: frank.getNonce()
        });

        const tx3OnNetwork = await processTransaction(frank, tx3, "tx3");
        const tx3Outcome = parser.parseFreeze(tx3OnNetwork);
        assert.equal(tx3Outcome.userAddress, grace.address.bech32());
        assert.equal(tx3Outcome.tokenIdentifier, tokenIdentifier);
        assert.equal(tx3Outcome.nonce, "0");
        assert.equal(tx3Outcome.balance, "10");

        // Wipe
        const tx4 = factory.wipe({
            manager: frank.address,
            user: grace.address,
            tokenIdentifier: tokenIdentifier,
            transactionNonce: frank.getNonce()
        });

        const tx4OnNetwork = await processTransaction(frank, tx4, "tx4");
        const tx4Outcome = parser.parseWipe(tx4OnNetwork);
        assert.equal(tx4Outcome.userAddress, grace.address.bech32());
        assert.equal(tx4Outcome.tokenIdentifier, tokenIdentifier);
        assert.equal(tx4Outcome.nonce, "0");
        assert.equal(tx4Outcome.balance, "10");
    });

    it("should issue and create NFT, then update attributes", async function () {
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
            transactionNonce: frank.getNonce()
        });

        const tx1OnNetwork = await processTransaction(frank, tx1, "tx1");
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
            transactionNonce: frank.getNonce()
        });

        const tx2OnNetwork = await processTransaction(frank, tx2, "tx2");
        const tx2Outcome = parser.parseSetSpecialRole(tx2OnNetwork);
        assert.include(tx2Outcome.roles, "ESDTRoleNFTCreate");
        assert.include(tx2Outcome.roles, "ESDTRoleNFTUpdateAttributes");

        // Create NFTs, then update their attributes
        for (let i = 1; i <= 2; i++) {
            // Create
            const txCreate = factory.nftCreate({
                creator: grace.address,
                tokenIdentifier: tokenIdentifier,
                initialQuantity: "1",
                name: `test-${i}`,
                royalties: 1000,
                hash: "abba",
                attributes: Buffer.from("test"),
                uris: ["a", "b"],
                transactionNonce: grace.getNonce()
            });

            const txCreateOnNetwork = await processTransaction(grace, txCreate, "txCreate");
            const txCreateOutcome = parser.parseNFTCreate(txCreateOnNetwork);

            assert.equal(txCreateOutcome.tokenIdentifier, tokenIdentifier);
            assert.equal(txCreateOutcome.nonce, i.toString());
            assert.equal(txCreateOutcome.initialQuantity, "1");

            // Update attributes
            const txUpdate = factory.updateAttributes({
                manager: grace.address,
                tokenIdentifier: txCreateOutcome.tokenIdentifier,
                tokenNonce: txCreateOutcome.nonce,
                attributes: Buffer.from("updated"),
                transactionNonce: grace.getNonce(),
            });

            const txUpdateOnNetwork = await processTransaction(grace, txUpdate, "txUpdate");
            const txUpdateOutcome = parser.parseUpdateAttributes(txUpdateOnNetwork);

            assert.equal(txUpdateOutcome.tokenIdentifier, tokenIdentifier);
            assert.equal(txUpdateOutcome.nonce, i.toString());
            assert.deepEqual(txUpdateOutcome.attributes, Buffer.from("updated"));
        }
    });

    it("should issue and create SFT, add quantity, burn quantity", async function () {
        this.timeout(200000);
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
            transactionNonce: frank.getNonce()
        });

        const tx1OnNetwork = await processTransaction(frank, tx1, "tx1");
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
            transactionNonce: frank.getNonce()
        });

        const tx2OnNetwork = await processTransaction(frank, tx2, "tx2");
        const tx2Outcome = parser.parseSetSpecialRole(tx2OnNetwork);
        assert.include(tx2Outcome.roles, "ESDTRoleNFTCreate");
        assert.include(tx2Outcome.roles, "ESDTRoleNFTAddQuantity");

        for (let i = 1; i <= 2; i++) {
            // Create SFT
            const txCreate = factory.nftCreate({
                creator: grace.address,
                tokenIdentifier: tokenIdentifier,
                initialQuantity: i * 10,
                name: `test-${i}`,
                royalties: 1000,
                hash: "abba",
                attributes: Buffer.from("test"),
                uris: ["a", "b"],
                transactionNonce: grace.getNonce()
            });

            const txCreateOnNetwork = await processTransaction(grace, txCreate, "txCreate");
            const txCreateOutcome = parser.parseNFTCreate(txCreateOnNetwork);

            assert.equal(txCreateOutcome.tokenIdentifier, tokenIdentifier);
            assert.equal(txCreateOutcome.nonce, i.toString());
            assert.equal(txCreateOutcome.initialQuantity, (i * 10).toString());

            // Add quantity
            const txAddQuantity = factory.addQuantity({
                manager: grace.address,
                tokenIdentifier: txCreateOutcome.tokenIdentifier,
                tokenNonce: txCreateOutcome.nonce,
                quantityToAdd: "3",
                transactionNonce: grace.getNonce()
            });

            const txAddQuantityOnNetwork = await processTransaction(grace, txAddQuantity, "txAddQuantity");
            const txAddQuantityOutcome = parser.parseAddQuantity(txAddQuantityOnNetwork);

            assert.equal(txAddQuantityOutcome.tokenIdentifier, tokenIdentifier);
            assert.equal(txAddQuantityOutcome.nonce, i.toString());
            assert.equal(txAddQuantityOutcome.addedQuantity, "3");

            // Burn quantity
            const txBurnQuantity = factory.burnQuantity({
                manager: grace.address,
                tokenIdentifier: txCreateOutcome.tokenIdentifier,
                tokenNonce: txCreateOutcome.nonce,
                quantityToBurn: "2",
                transactionNonce: grace.getNonce()
            });

            const txBurnQuantityOnNetwork = await processTransaction(grace, txBurnQuantity, "txBurnQuantity");
            const txBurnQuantityOutcome = parser.parseBurnQuantity(txBurnQuantityOnNetwork);

            assert.equal(txBurnQuantityOutcome.tokenIdentifier, tokenIdentifier);
            assert.equal(txBurnQuantityOutcome.nonce, i.toString());
            assert.equal(txBurnQuantityOutcome.burntQuantity, "2");
        }
    });

    it("should register and create Meta ESDT", async function () {
        this.timeout(180000);
        await frank.sync(provider);
        await grace.sync(provider);

        // Register Meta ESDT
        const tx1 = factory.registerMetaESDT({
            issuer: frank.address,
            tokenName: "FRANK",
            tokenTicker: "FRANK",
            numDecimals: 10,
            canFreeze: true,
            canWipe: true,
            canPause: true,
            canTransferNFTCreateRole: true,
            canChangeOwner: true,
            canUpgrade: true,
            canAddSpecialRoles: true,
            transactionNonce: frank.getNonce()
        });

        const tx1OnNetwork = await processTransaction(frank, tx1, "tx1");
        const tx1Outcome = parser.parseRegisterMetaESDT(tx1OnNetwork);
        const tokenIdentifier = tx1Outcome.tokenIdentifier;
        assert.isTrue(tokenIdentifier.includes("FRANK"));

        // Set roles (give Grace the ability to create Meta ESDTs)
        const tx2 = factory.setSpecialRoleOnMetaESDT({
            manager: frank.address,
            user: grace.address,
            tokenIdentifier: tokenIdentifier,
            addRoleNFTCreate: true,
            addRoleNFTBurn: false,
            addRoleNFTAddQuantity: true,
            addRoleESDTTransferRole: false,
            transactionNonce: frank.getNonce()
        });

        const tx2OnNetwork = await processTransaction(frank, tx2, "tx2");
        const tx2Outcome = parser.parseSetSpecialRole(tx2OnNetwork);
        assert.include(tx2Outcome.roles, "ESDTRoleNFTCreate");
        assert.include(tx2Outcome.roles, "ESDTRoleNFTAddQuantity");

        // Create tokens
        for (let i = 1; i <= 3; i++) {
            const tx = factory.nftCreate({
                creator: grace.address,
                tokenIdentifier: tokenIdentifier,
                initialQuantity: i * 10,
                name: `test-${i}`,
                royalties: 1000,
                hash: "abba",
                attributes: Buffer.from("test"),
                uris: ["a", "b"],
                transactionNonce: grace.getNonce()
            });

            const txOnNetwork = await processTransaction(grace, tx, "tx");
            const txOutcome = parser.parseNFTCreate(txOnNetwork);

            assert.equal(txOutcome.tokenIdentifier, tokenIdentifier);
            assert.equal(txOutcome.nonce, i.toString());
            assert.equal(txOutcome.initialQuantity, (i * 10).toString());
        }
    });

    async function processTransaction(wallet: TestWallet, transaction: Transaction, tag: string): Promise<ITransactionOnNetwork> {
        wallet.incrementNonce();
        await wallet.signer.sign(transaction);
        await provider.sendTransaction(transaction);
        console.log(`Sent transaction [${tag}]: ${transaction.getHash().hex()}`);

        const transactionOnNetwork = await watcher.awaitCompleted(transaction);
        return transactionOnNetwork;
    }
});
