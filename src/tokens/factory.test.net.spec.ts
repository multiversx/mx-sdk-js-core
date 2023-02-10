import { assert } from "chai";
import { AsyncTimer } from "../asyncTimer";
import { INetworkConfig } from "../interfaceOfNetwork";
import { loadTestWallets, TestWallet } from "../testutils";
import { createTestnetProvider, INetworkProvider } from "../testutils/networkProviders";
import { TransactionWatcher } from "../transactionWatcher";
import { DefaultTokenTransactionsFactoryConfig } from "./configuration";
import { TokenTransactionsFactory } from "./factory";
import { TokenTransactionsOutcomeParser } from "./parser";

describe("test factory on testnet", function () {
    let frank: TestWallet, grace: TestWallet;
    let provider: INetworkProvider;
    let watcher: TransactionWatcher;
    let network: INetworkConfig;
    let factory: TokenTransactionsFactory;
    let parser: TokenTransactionsOutcomeParser;

    before(async function () {
        ({ frank, grace } = await loadTestWallets());

        provider = createTestnetProvider();
        watcher = new TransactionWatcher(provider);
        network = await provider.getNetworkConfig();
        factory = new TokenTransactionsFactory(new DefaultTokenTransactionsFactoryConfig(network.ChainID));
        parser = new TokenTransactionsOutcomeParser();
    });

    it("should issueFungible", async function () {
        this.timeout(60000);
        await frank.sync(provider);

        const transaction = factory.issueFungible({
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
        await frank.signer.sign(transaction);
        await provider.sendTransaction(transaction);

        const transactionOnNetwork = await watcher.awaitCompleted(transaction);
        const outcome = parser.parseIssueFungible(transactionOnNetwork);
        assert.isTrue(outcome.tokenIdentifier.includes("FRANK"));
    });

    it.only("should issue and create NFT", async function () {
        this.timeout(180000);
        await frank.sync(provider);
        await grace.sync(provider);

        // Issue NFT
        const issueTransaction = factory.issueNonFungible({
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
        await frank.signer.sign(issueTransaction);
        await provider.sendTransaction(issueTransaction);

        const issueTransactionOnNetwork = await watcher.awaitCompleted(issueTransaction);
        const issueOutcome = parser.parseIssueNonFungible(issueTransactionOnNetwork);
        const tokenIdentifier = issueOutcome.tokenIdentifier;
        assert.isTrue(tokenIdentifier.includes("FRANK"));

        // Set roles (give Grace the ability to create NFTs)
        const setRolesTransaction = factory.setSpecialRoleOnNonFungible({
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
        await frank.signer.sign(setRolesTransaction);
        await provider.sendTransaction(setRolesTransaction);

        let setRolesTransactionOnNetwork = await watcher.awaitCompleted(setRolesTransaction);

        // For such transactions, the "isCompleted" field is somehow incorrect (false positive).
        // Let's wait a bit more to have the outcome. 
        await (new AsyncTimer("test")).start(1000);
        setRolesTransactionOnNetwork = await watcher.awaitCompleted(setRolesTransaction);

        const setRolesOutcome = parser.parseSetSpecialRole(setRolesTransactionOnNetwork);
        assert.include(setRolesOutcome.roles, "ESDTRoleNFTCreate");
        assert.include(setRolesOutcome.roles, "ESDTRoleNFTUpdateAttributes");

        // Create NFTs
        for (let i = 1; i <= 3; i++) {
            const createNFTTransaction = factory.nftCreate({
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
            await grace.signer.sign(createNFTTransaction);
            await provider.sendTransaction(createNFTTransaction);

            const createNFTTransactionOnNetwork = await watcher.awaitCompleted(createNFTTransaction);
            const createNFTOutcome = parser.parseNFTCreate(createNFTTransactionOnNetwork);

            assert.equal(createNFTOutcome.tokenIdentifier, tokenIdentifier);
            assert.equal(createNFTOutcome.nonce, i);
            assert.equal(createNFTOutcome.initialQuantity, 1);
        }
    });
});
