import { AxiosHeaders } from "axios";
import { ExtendedAxiosRequestConfig } from "./NetworkProviderConfig";

export function setUserAgent(userAgentPrefix: string, config: ExtendedAxiosRequestConfig | undefined) {
    if (!config) {
        config = { headers: new AxiosHeaders({}) }
    }
    if (!config.headers) {
        config.headers = new AxiosHeaders({})
    };

    const headers = AxiosHeaders.from(config.headers as AxiosHeaders).normalize(true);
    if (!config.clientName) {
        console.log("Can you please provide the client name of the aplication that uses the sdk?")
    }
    const resolvedClientName = config.clientName || 'unknown';

    const currentUserAgent = headers.hasUserAgent() ? headers.getUserAgent() : '';
    const newUserAgent = `${currentUserAgent} ${userAgentPrefix}${resolvedClientName}`.trim();

    headers.setUserAgent(newUserAgent, true);
}
