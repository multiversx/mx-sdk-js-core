import { PathLike } from "fs";
import { Code } from "../smartcontracts/code";
import { AbiRegistry } from "../smartcontracts/typesystem";
import { TransactionWatcher } from "../transactionWatcher";

export async function loadContractCode(path: PathLike): Promise<Code> {
    if (isOnBrowserTests()) {
        return Code.fromUrl(path.toString());
    }

    return Code.fromFile(path);
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
