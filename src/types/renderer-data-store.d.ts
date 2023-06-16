import { DataStore } from '../entities/data-store.interface';

export type RendererDataStore = Omit<DataStore, 'accessToken' | 'debugInfo'> & {
    accessToken?: undefined;
    hasAccessToken: boolean;
};
