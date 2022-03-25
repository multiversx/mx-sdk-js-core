import * as fs from "fs";
import axios from "axios";

export async function readTestFile(filePath: string): Promise<string> {
    if (isOnBrowserTests()) {
        return await downloadTextFile(filePath);
    }

    return await fs.promises.readFile(filePath, { encoding: "utf8" });
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

export async function downloadTextFile(url: string) {
    let response = await axios.get(url, { responseType: "text", transformResponse: [] });
    let text = response.data.toString();
    return text;
}
