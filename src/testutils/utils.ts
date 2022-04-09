import { PathLike } from "fs";
import * as fs from "fs";
import { SmartContract } from "../smartcontracts/smartContract";
import { Code } from "../smartcontracts/code";
import { AbiRegistry, TypedValue } from "../smartcontracts/typesystem";
import { Transaction } from "../transaction";
import { TransactionWatcher } from "../transactionWatcher";
import { IChainID, IGasLimit } from "../interface";
import { TestWallet } from "./wallets";

export async function prepareDeployment(obj: {
    deployer: TestWallet,
    contract: SmartContract,
    codePath: string,
    initArguments: TypedValue[],
    gasLimit: IGasLimit,
    chainID: IChainID
}): Promise<Transaction> {
    let contract = obj.contract;
    let deployer = obj.deployer;

    let transaction = obj.contract.deploy({
        code: await loadContractCode(obj.codePath),
        gasLimit: obj.gasLimit,
        initArguments: obj.initArguments,
        chainID: obj.chainID
    });

    let nonce = deployer.account.getNonceThenIncrement();
    let contractAddress = SmartContract.computeAddress(deployer.address, nonce);
    transaction.setNonce(nonce);
    contract.setAddress(contractAddress);
    await deployer.signer.sign(transaction);
    
    return transaction;
}

export async function loadContractCode(path: PathLike): Promise<Code> {
    if (isOnBrowserTests()) {
        return Code.fromUrl(path.toString());
    }

    // Load from file.
    let buffer: Buffer = await fs.promises.readFile(path);
    return Code.fromBuffer(buffer);
}

export async function loadAbiRegistry(paths: PathLike[]): Promise<AbiRegistry> {
    let sources = paths.map(e => e.toString());

    if (isOnBrowserTests()) {
        return AbiRegistry.load({ urls: sources });
    }

    return AbiRegistry.load({ files: sources });
}

export async function extendAbiRegistry(registry: AbiRegistry, path: PathLike): Promise<AbiRegistry> {
    let source = path.toString();

    if (isOnBrowserTests()) {
        return registry.extendFromUrl(source);
    }

    return registry.extendFromFile(source);
}

export function isOnBrowserTests() {
    const BROWSER_TESTS_URL = "browser-tests";

    let noWindow = typeof window === "undefined";
    if (noWindow) {
        return false;
    }

    let isOnTests = window.location.href.includes(BROWSER_TESTS_URL);
    return isOnTests;
}

export function setupUnitTestWatcherTimeouts() {
    TransactionWatcher.DefaultPollingInterval = 42;
    TransactionWatcher.DefaultTimeout = 42 * 42;
}
