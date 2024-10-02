import { AxiosHeaders } from "axios";
import { NetworkProviderConfig } from "./networkProviderConfig";
import { UnknownClientName } from "./constants";

export function extendUserAgent(userAgentPrefix: string, config: NetworkProviderConfig) {
    if (!config.headers) {
        config.headers = new AxiosHeaders({})
    };
    if (!config.clientName) {
        console.log("Can you please provide the client name of the application that uses the SDK? It will be used for metrics.")
    }
    const headers = AxiosHeaders.from(config.headers as AxiosHeaders).normalize(true);
    const resolvedClientName = config.clientName || UnknownClientName;

    const currentUserAgent = headers.hasUserAgent() ? headers.getUserAgent() : '';
    const newUserAgent = currentUserAgent ? `${currentUserAgent} ${userAgentPrefix}/${resolvedClientName}` : `${userAgentPrefix}/${resolvedClientName}`;

    headers.setUserAgent(newUserAgent, true);
}
