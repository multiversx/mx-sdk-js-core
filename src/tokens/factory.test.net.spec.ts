import { assert } from "chai";
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

    it.only("should send transactions", async function () {
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
        assert.isTrue(outcome.tokenIdentifier);
    });
});
