import { PathLike } from "fs";
import * as fs from "fs";
import { SmartContract } from "../smartcontracts/smartContract";
import { Code } from "../smartcontracts/code";
import { AbiRegistry, TypedValue } from "../smartcontracts/typesystem";
import { Transaction } from "../transaction";
import { TransactionWatcher } from "../transactionWatcher";
import { IChainID, IGasLimit } from "../interface";
import { TestWallet } from "./wallets";
import axios, { AxiosResponse } from "axios";

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
        let response: AxiosResponse<ArrayBuffer> = await axios.get(path.toString(), {
            responseType: 'arraybuffer',
            transformResponse: [],
            headers: {
                "Accept": "application/wasm"
            }
        });

        let buffer = Buffer.from(response.data);
        return Code.fromBuffer(buffer);
    }
    
    // Load from file.
    let buffer: Buffer = await fs.promises.readFile(path);
    return Code.fromBuffer(buffer);
}

export async function loadAbiRegistry(path: PathLike): Promise<AbiRegistry> {
    if (isOnBrowserTests()) {
        let response: AxiosResponse = await axios.get(path.toString());
        return AbiRegistry.create(response.data);
    }

    // Load from files
    let jsonContent: string = await fs.promises.readFile(path, { encoding: "utf8" });
    let json = JSON.parse(jsonContent);
    return AbiRegistry.create(json);
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
