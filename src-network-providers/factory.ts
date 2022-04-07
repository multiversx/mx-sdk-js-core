import { AxiosRequestConfig } from "axios";
import { ApiNetworkProvider } from "./apiNetworkProvider";
import { INetworkProvider } from "./interface";
import { ProxyNetworkProvider } from "./proxyNetworkProvider";

export function createProxyNetworkProvider(url: string, config?: AxiosRequestConfig): INetworkProvider {
    return new ProxyNetworkProvider(url, config);
}

export function createApiNetworkProvider(url: string, config?: AxiosRequestConfig): INetworkProvider {
    return new ApiNetworkProvider(url, config);
}
