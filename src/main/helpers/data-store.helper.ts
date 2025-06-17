import electron from 'electron';
import fs from 'fs';
import { isNil } from 'lodash';
import path from 'path';
import { RendererDataStore } from 'types/renderer-data-store';
import { DataStore } from '../../entities/data-store.interface';
import { getDataFileName } from '../helpers/environment.helpers';
import { Logger } from './logger.helpers';

export class DataStoreHelper {
    private static _instance: DataStoreHelper;
    private readonly logger = new Logger(this.constructor.name);
    private readonly _path: string;
    private data: DataStore;
    private readonly listeners: Array<(data: RendererDataStore) => void> = [];

    static get instance(): DataStoreHelper {
        if (!this._instance) {
            this._instance = new DataStoreHelper();
        }
        return this._instance;
    }

    private constructor() {
        const userDataPath = electron.app.getPath('userData');
        const fileName = `${getDataFileName()}.json`;
        this._path = path.join(userDataPath, fileName);

        this.initializeDataFile();
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

        this.logger.info('Data file cleared.');

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
        if (!fs.existsSync(this._path)) {
            try {
                this.data = {};
                this.writeData();
                this.logger.info('Data file initialized successfully.');
            } catch (error: unknown) {
                // needs safe failure for static imports
                this.logger.error(
                    String(error),
                    'Failure attempting to initialize the data store file.',
                );
            }
        }
    }

    private loadData(): DataStore {
        try {
            const data = fs.readFileSync(this._path, { encoding: 'utf8' });
            return JSON.parse(data) as DataStore;
        } catch (error: unknown) {
            this.logger.error(
                String(error),
                'Failure attempting to read the data store file.',
            );
            return {}; // need safe failure for static imports
        }
    }

    private writeData(): void {
        try {
            fs.writeFileSync(this._path, JSON.stringify(this.data, null, 4));
        } catch (error) {
            this.logger.error(
                error,
                'Failure attempting to write to the data store file.',
            );
            throw error;
        }
    }
}
