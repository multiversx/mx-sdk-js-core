import * as fs from "fs";
import { PathLike } from "fs";
import { resolve } from "path";
import { Abi } from "../abi";
import { getAxios } from "../core/utils";

export async function loadContractCode(path: PathLike): Promise<Uint8Array> {
    if (isOnBrowserTests()) {
        const axios = await getAxios();
        let response: any = await axios.default.get(path.toString(), {
            responseType: "arraybuffer",
            transformResponse: [],
            headers: {
                Accept: "application/wasm",
            },
        });

        return Buffer.from(response.data);
    }

    // Load from file.
    let buffer: Buffer = await fs.promises.readFile(path);
    return buffer;
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
    } catch (error: any) {
        throw new Error(`Failed to parse JSON: ${error.message}`);
    }
};
