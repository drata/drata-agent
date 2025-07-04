import { QueryResult } from '../main/services/system-query/entities/query-result.type';
import { RendererDataStore } from '../types/renderer-data-store';
import { Message } from './message.interface';

export interface BridgeChannel {
    // main to renderer
    appReady: boolean;
    addError: any;
    toast: Message;
    dataStoreUpdate: RendererDataStore;
    // renderer to main
    getDataStore: RendererDataStore;
    runSync: void;
    openLink: void;
    hideApp: void;
    dumpDiagnostics: void;
    allowResize: void;
    quitApp: void;
    localRegister: void;
    changeLanguage: void;
    downloadLog: void;
    getSystemInfo: QueryResult;
    clearRegistration: void;
}
