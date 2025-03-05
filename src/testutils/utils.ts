import * as fs from "fs";
import { PathLike } from "fs";
import { resolve } from "path";
import { Abi, Code, SmartContract, TypedValue } from "../abi";
import { Account } from "../accounts";
import { Transaction } from "../core/transaction";
import { getAxios } from "../core/utils";

export async function prepareDeployment(obj: {
    deployer: Account;
    contract: SmartContract;
    codePath: string;
    initArguments: TypedValue[];
    gasLimit: bigint;
    chainID: string;
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

    let nonce = deployer.getNonceThenIncrement();
    let contractAddress = SmartContract.computeAddress(deployer.address, nonce);
    transaction.nonce = nonce;
    transaction.sender = deployer.address;
    contract.setAddress(contractAddress);
    transaction.signature = await deployer.signTransaction(transaction);

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

export async function loadAbiRegistry(path: PathLike): Promise<Abi> {
    if (isOnBrowserTests()) {
        const axios = await getAxios();
        let response: any = await axios.default.get(path.toString());
        return Abi.create(response.data);
    }

    // Load from files
    let jsonContent: string = await fs.promises.readFile(path, { encoding: "utf8" });
    let json = JSON.parse(jsonContent);
    return Abi.create(json);
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

export function createAccountBalance(egld: number): bigint {
    return BigInt(egld.toString() + "0".repeat(18));
}

export function b64TopicsToBytes(topics: string[]): Uint8Array[] {
    return topics.map((topic) => Buffer.from(topic, "base64"));
}

export function b64ToHex(value: string): string {
    return Buffer.from(value, "base64").toString("hex");
}

export function getTestWalletsPath(): string {
    return resolve(__dirname, "..", "testdata", "testwallets");
}

export const stringifyBigIntJSON = (jsonString: any): any => {
    const JSONBig = require("json-bigint")({ constructorAction: "ignore" });
    try {
        return JSONBig.stringify(jsonString);
    } catch (error) {
        throw new Error(`Failed to parse JSON: ${error.message}`);
    }
};
