import { AxiosRequestConfig } from 'axios';

export interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
    clientName?: string;
}
