import BigNumber from "bignumber.js";
import * as fs from "fs";
import { PathLike } from "fs";
import { AbiRegistry, Code, SmartContract, TypedValue } from "../abi";
import { IChainID, IGasLimit } from "../interface";
import { Transaction } from "../transaction";
import { TransactionWatcher } from "../transactionWatcher";
import { getAxios } from "../utils";
import { TestWallet } from "./wallets";

export async function prepareDeployment(obj: {
    deployer: TestWallet;
    contract: SmartContract;
    codePath: string;
    initArguments: TypedValue[];
    gasLimit: IGasLimit;
    chainID: IChainID;
}): Promise<Transaction> {
    let contract = obj.contract;
    let deployer = obj.deployer;

    let transaction = obj.contract.deploy({
        code: await loadContractCode(obj.codePath),
        gasLimit: obj.gasLimit,
        initArguments: obj.initArguments,
        chainID: obj.chainID,
        deployer: deployer.address,
    });

    let nonce = deployer.account.getNonceThenIncrement();
    let contractAddress = SmartContract.computeAddress(deployer.address, nonce);
    transaction.setNonce(nonce);
    transaction.setSender(deployer.address);
    contract.setAddress(contractAddress);
    transaction.applySignature(await deployer.signer.sign(transaction.serializeForSigning()));

    return transaction;
}

export async function loadContractCode(path: PathLike): Promise<Code> {
    if (isOnBrowserTests()) {
        const axios = await getAxios();
        let response: any = await axios.default.get(path.toString(), {
            responseType: "arraybuffer",
            transformResponse: [],
            headers: {
                Accept: "application/wasm",
            },
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
        const axios = await getAxios();
        let response: any = await axios.default.get(path.toString());
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

export function createAccountBalance(egld: number): BigNumber {
    return new BigNumber(egld.toString() + "0".repeat(18));
}

export function b64TopicsToBytes(topics: string[]): Uint8Array[] {
    return topics.map((topic) => Buffer.from(topic, "base64"));
}

export function b64ToHex(value: string): string {
    return Buffer.from(value, "base64").toString("hex");
}
