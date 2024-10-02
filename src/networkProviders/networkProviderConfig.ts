import { AxiosRequestConfig } from 'axios';

export interface NetworkProviderConfig extends AxiosRequestConfig {
    clientName?: string;
}
