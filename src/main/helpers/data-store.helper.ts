import electron from 'electron';
import fs from 'fs';
import { isNil } from 'lodash';
import path from 'path';
import { RendererDataStore } from 'types/renderer-data-store';
import { TARGET_ENV } from '../../constants/environment';
import { DataStore } from '../../entities/data-store.interface';
import { getDataFileName } from '../helpers/environment.helpers';
import { Logger } from './logger.helpers';
import { PathHelper } from './path.helpers';
export class DataStoreHelper {
    static instance: DataStoreHelper = new DataStoreHelper();
    private readonly logger = new Logger(this.constructor.name);

    private path: string;
    private data: DataStore;

    private listeners: Array<(data: RendererDataStore) => void> = [];

    private constructor() {
        const userDataPath = electron.app.getPath('userData');
        const fileName = `${getDataFileName()}.json`;

        this.path = path.join(userDataPath, fileName);

        this.initializeDataFile();

        if (!TARGET_ENV.PROD) {
            this.logger.info(
                `Storage path: ${PathHelper.safeSpaces(this.path)}`,
            );
        }

        this.data = this.loadData();
    }

    /**
     * Retrieves a value from the store
     *
     * _Note: values are cached_
     * @param key
     * @returns value required
     */
    get<K extends keyof DataStore>(key: K) {
        return this.data[key];
    }

    /**
     * Stores a value in the store and emits a change
     * Note: this process involves writing to a json file on disk
     * @param key
     * @param val
     */
    set<K extends keyof DataStore>(key: K, val: DataStore[K]) {
        this.data[key] = val;
        this.writeData();
        this.emitChange();
    }

    /**
     * Stores the updated values in the store and emits a change
     * Note: this process involves writing to a json file on disk
     * @param key
     * @param val
     */
    multiSet(update: Partial<DataStore>) {
        this.data = {
            ...this.data,
            ...update,
        };
        this.writeData();
        this.emitChange();
    }

    /**
     * Deletes a value from the store and emits a change
     * Note: this process involves writing to a json file on disk
     * @param key
     * @param val
     */
    remove<K extends keyof DataStore>(key: K) {
        delete this.data[key];
        this.writeData();
        this.emitChange();
    }

    onChange(listener: (data: RendererDataStore) => void) {
        this.listeners.push(listener);
    }

    clearData() {
        this.data = {};
        this.writeData();
        this.emitChange();
    }

    get isInitDataReady(): boolean {
        return !isNil(this.data.winAvServicesMatchList);
    }

    get dataForRenderer() {
        const { accessToken, ...data } = this.data;

        return {
            ...data,
            hasAccessToken: !!accessToken,
        };
    }

    private emitChange(): void {
        this.listeners.forEach(listener => listener(this.dataForRenderer));
    }

    private initializeDataFile() {
        try {
            fs.statSync(this.path);
        } catch (expectedError) {
            // if we get here it means the file doesn't exist.
            try {
                this.data = {};
                this.writeData();
                this.logger.info('Data file initialized.');
            } catch (error) {
                this.logger.error(
                    error,
                    'Failure attempting to initialize the data store file.',
                );
            }
        }
    }

    private loadData(): DataStore {
        try {
            const data = fs.readFileSync(this.path, { encoding: 'utf8' });
            return JSON.parse(data) as DataStore;
        } catch (error) {
            this.logger.error(
                error,
                'Failure attempting to read the data store file.',
            );
            return {} as DataStore;
        }
    }

    private writeData(): void {
        try {
            fs.writeFileSync(this.path, JSON.stringify(this.data, null, 4));
        } catch (error) {
            this.logger.error(
                error,
                'Failure attempting to write to the data store file.',
            );
        }
    }
}
