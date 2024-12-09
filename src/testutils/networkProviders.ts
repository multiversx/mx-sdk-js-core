import { ApiNetworkProvider, ProxyNetworkProvider } from "../networkProviders";
import { INetworkProvider } from "../networkProviders/interface";

export function createLocalnetProvider(): INetworkProvider {
    return new ProxyNetworkProvider("http://localhost:7950", { timeout: 5000 });
}

export function createTestnetProvider(): INetworkProvider {
    return new ApiNetworkProvider("https://testnet-api.multiversx.com", {
        timeout: 5000,
        clientName: "mx-sdk-js-core/tests",
    });
}

export function createDevnetProvider(): INetworkProvider {
    return new ProxyNetworkProvider("https://devnet-gateway.multiversx.com", {
        timeout: 5000,
        clientName: "mx-sdk-js-core/tests",
    });
}

export function createMainnetProvider(): INetworkProvider {
    return new ProxyNetworkProvider("https://gateway.multiversx.com", {
        timeout: 10000,
        clientName: "mx-sdk-js-core/tests",
    });
}
