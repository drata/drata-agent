import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Region } from 'enums/region.enum';
import { DataStoreHelper } from './data-store.helper';
import { resolveBaseUrl } from './environment.helpers';

export class AxiosHelper {
    static instance: AxiosHelper = new AxiosHelper();

    private readonly dataStore = DataStoreHelper.instance;

    private readonly axiosInstance = axios.create();

    private constructor() {
        // insert authorization header before requests
        this.axiosInstance.interceptors.request.use(
            async config => {
                const region = this.dataStore
                    .get('region')
                    ?.replace(/\/$/, '') as Region;

                return {
                    ...config,
                    baseURL: resolveBaseUrl(region),
                    headers: {
                        common: {
                            Authorization: `Bearer ${this.dataStore.get(
                                'accessToken',
                            )}`,
                            'Content-Type': 'application/json',
                            'User-Agent': 'Drata-Agent/1.0',
                        },
                    },
                };
            },
            error => Promise.reject(error),
        );
    }

    get<T = any, R = AxiosResponse<T>>(
        url: string,
        config?: AxiosRequestConfig,
    ): Promise<R> {
        return this.axiosInstance.get(url, config);
    }

    post<T = any, R = AxiosResponse<T>>(
        url: string,
        data?: any,
        config?: AxiosRequestConfig,
    ): Promise<R> {
        return this.axiosInstance.post(url, data, config);
    }
}
