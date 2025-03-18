import { assert } from "chai";
import { promises } from "fs";
import { Account } from "../accounts";
import { TransactionsFactoryConfig } from "../core/transactionsFactoryConfig";
import { TransactionWatcher } from "../core/transactionWatcher";
import { SmartContractTransactionsFactory, SmartContractTransactionsOutcomeParser } from "../smartContracts";
import { getTestWalletsPath, prepareDeployment } from "../testutils";
import { createLocalnetProvider } from "../testutils/networkProviders";
import { ContractFunction } from "./function";
import { SmartContract } from "./smartContract";

describe("fetch transactions from local testnet", function () {
    let alice: Account;
    let provider = createLocalnetProvider();
    let watcher: TransactionWatcher;
    let parser: SmartContractTransactionsOutcomeParser;

    before(async function () {
        alice = await Account.newFromPem(`${getTestWalletsPath()}/alice.pem`);
        watcher = new TransactionWatcher(
            {
                getTransaction: async (hash: string) => {
                    return await provider.getTransaction(hash);
                },
            },
            {
                pollingIntervalMilliseconds: 5000,
                timeoutMilliseconds: 50000,
            },
        );

        parser = new SmartContractTransactionsOutcomeParser();
    });

    it("counter smart contract", async function () {
        this.timeout(60000);

        let network = await provider.getNetworkConfig();
        alice.nonce = (await provider.getAccount(alice.address)).nonce;

        // Deploy
        let contract = new SmartContract({});

        let transactionDeploy = await prepareDeployment({
            contract: contract,
            deployer: alice,
            codePath: "src/testdata/counter.wasm",
            gasLimit: 3000000n,
            initArguments: [],
            chainID: network.chainID,
        });

        // ++
        let transactionIncrement = contract.call({
            func: new ContractFunction("increment"),
            gasLimit: 3000000n,
            chainID: network.chainID,
            caller: alice.address,
        });

        transactionIncrement.nonce = alice.getNonceThenIncrement();
        transactionIncrement.signature = await alice.signTransaction(transactionIncrement);

        // Broadcast & execute
        const txHashDeploy = await provider.sendTransaction(transactionDeploy);
        const txHashIncrement = await provider.sendTransaction(transactionIncrement);

        await watcher.awaitCompleted(txHashDeploy);
        await watcher.awaitCompleted(txHashIncrement);

        const transactionOnNetworkDeploy = await provider.getTransaction(txHashDeploy);
        const transactionOnNetworkIncrement = await provider.getTransaction(txHashIncrement);

        let response = parser.parseExecute({ transactionOnNetwork: transactionOnNetworkDeploy });
        assert.isTrue(response.returnCode == "ok");

        response = parser.parseExecute({ transactionOnNetwork: transactionOnNetworkIncrement });
        assert.isTrue(response.returnCode == "ok");
    });

    it("interact with counter smart contract using SmartContractTransactionsFactory", async function () {
        this.timeout(60000);

        let network = await provider.getNetworkConfig();

        const config = new TransactionsFactoryConfig({ chainID: network.chainID });
        const factory = new SmartContractTransactionsFactory({ config: config });

        const bytecode = await promises.readFile("src/testdata/counter.wasm");
        alice.nonce = (await provider.getAccount(alice.address)).nonce;

        const deployTransaction = factory.createTransactionForDeploy(alice.address, {
            bytecode: bytecode,
            gasLimit: 3000000n,
        });
        deployTransaction.nonce = alice.nonce;
        deployTransaction.signature = await alice.signTransaction(deployTransaction);

        const contractAddress = SmartContract.computeAddress(alice.address, alice.nonce);
        alice.incrementNonce();
        const smartContractCallTransaction = factory.createTransactionForExecute(alice.address, {
            contract: contractAddress,
            function: "increment",
            gasLimit: 3000000n,
        });
        smartContractCallTransaction.nonce = alice.getNonceThenIncrement();
        smartContractCallTransaction.signature = await alice.signTransaction(smartContractCallTransaction);

        // Broadcast & execute
        const deployTxHash = await provider.sendTransaction(deployTransaction);
        const callTxHash = await provider.sendTransaction(smartContractCallTransaction);

        await watcher.awaitCompleted(deployTxHash);
        await watcher.awaitCompleted(callTxHash);

        let transactionOnNetworkDeploy = await provider.getTransaction(deployTxHash);
        let transactionOnNetworkIncrement = await provider.getTransaction(callTxHash);

        let response = parser.parseExecute({ transactionOnNetwork: transactionOnNetworkDeploy });
        assert.isTrue(response.returnCode == "ok");

        response = parser.parseExecute({ transactionOnNetwork: transactionOnNetworkIncrement });
        assert.isTrue(response.returnCode == "ok");
    });
});
