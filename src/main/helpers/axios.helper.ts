import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import crypto from 'crypto';
import { app } from 'electron';
import { Region } from 'enums/region.enum';
import { isNil } from 'lodash';
import { DataStoreHelper } from './data-store.helper';
import { resolveBaseUrl } from './environment.helpers';

export class AxiosHelper {
    static instance: AxiosHelper = new AxiosHelper();
    private readonly dataStore = DataStoreHelper.instance;
    private readonly axiosInstance = axios.create();
    private readonly REQUEST_TIMEOUT = 5 * 60 * 1000;

    private constructor() {
        // prepare headers for requests
        this.axiosInstance.interceptors.request.use(
            async config => {
                const region = this.dataStore
                    .get('region')
                    ?.replace(/\/$/, '') as Region;

                const uuid = this.dataStore.get('uuid');
                if (isNil(uuid)) {
                    this.dataStore.set('uuid', crypto.randomUUID());
                }
                config.timeout = this.REQUEST_TIMEOUT;
                config.baseURL = resolveBaseUrl(region);
                config.headers.Authorization = `Bearer ${this.dataStore.get(
                    'accessToken',
                )}`;
                config.headers['Content-Type'] = 'application/json';
                config.headers['Correlation-Id'] = uuid;
                config.headers[
                    'User-Agent'
                ] = `Drata-Agent/${app.getVersion()} (${process.platform})`;

                return config;
            },
            error => Promise.reject(error),
        );
    }

    get<T = any, R = AxiosResponse<T>>(
        url: string,
        config?: AxiosRequestConfig<any>,
    ): Promise<R> {
        return this.axiosInstance.get(url, config);
    }

    post<T = any, R = AxiosResponse<T>>(
        url: string,
        data?: any,
        config?: AxiosRequestConfig<any>,
    ): Promise<R> {
        return this.axiosInstance.post(url, data, config);
    }
}
