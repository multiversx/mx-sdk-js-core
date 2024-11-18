export interface EntrypointConfig {
    networkProviderUrl: string;
    networkProviderKind: string;
    chainId: string;
}

export class TestnetEntrypointConfig implements EntrypointConfig {
    networkProviderUrl = "https://testnet-api.multiversx.com";
    networkProviderKind = "api";
    chainId = "T";
}

export class DevnetEntrypointConfig implements EntrypointConfig {
    networkProviderUrl = "https://devnet-api.multiversx.com";
    networkProviderKind = "api";
    chainId = "D";
}

export class MainnetEntrypointConfig implements EntrypointConfig {
    networkProviderUrl = "https://api.multiversx.com";
    networkProviderKind = "api";
    chainId = "1";
}

export class LocalnetEntrypointConfig implements EntrypointConfig {
    networkProviderUrl = "http://localhost:7950";
    networkProviderKind = "proxy";
    chainId = "localnet";
}
