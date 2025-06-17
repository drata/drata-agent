import {
    app,
    BrowserWindow,
    ipcMain,
    IpcMainInvokeEvent,
    shell,
} from 'electron';
import { isNil } from 'lodash';
import os from 'os';
import { BridgeChannel } from '../entities/bridge-channel.interface';
import { Region } from '../enums/region.enum';
import { DataStoreHelper } from '../main/helpers/data-store.helper';
import { IntlHelper } from '../main/helpers/intl.helper';
import { Logger } from '../main/helpers/logger.helpers';
import { SchedulerService } from '../main/services/scheduler/scheduler.service';
import { QueryResult } from '../main/services/system-query/entities/query-result.type';

export class MainBridge {
    private static _instance: MainBridge;
    private readonly logger = new Logger(MainBridge.name);
    private readonly dataStore = DataStoreHelper.instance;
    private sender: BrowserWindow;

    static get instance(): MainBridge {
        return MainBridge._instance;
    }

    static getInstance(
        win: BrowserWindow | null,
        handleSync: (manualRun: boolean) => void,
        localRegister: (token: string, region: Region) => void,
        systemQuery: () => Promise<QueryResult>,
    ) {
        if (isNil(MainBridge._instance)) {
            MainBridge._instance = new MainBridge(
                win,
                handleSync,
                localRegister,
                systemQuery,
            );
        } else if (win) {
            // Update the window reference if provided
            MainBridge._instance.sender = win;
        }
        return MainBridge._instance;
    }

    sendMessage<BCh extends keyof BridgeChannel>(
        channel: BCh,
        data: BridgeChannel[BCh],
    ) {
        this.sender.webContents.send(channel.toString(), data);
    }

    private constructor(
        win: BrowserWindow | null,
        private readonly handleSync: (manualRun: boolean) => void,
        private readonly localRegister: (token: string, region: Region) => void,
        private readonly systemQuery: () => Promise<QueryResult>,
    ) {
        this.sender = win as BrowserWindow;
        this.initHanders();
    }

    private initHanders() {
        ipcMain.handle('getDataStore', this.handleGetDataStore.bind(this));
        ipcMain.handle('openLink', this.handleOpenLink.bind(this));
        ipcMain.handle('changeLanguage', this.handleChangeLanguage.bind(this));
        ipcMain.handle('quitApp', this.handleQuitApp.bind(this));
        ipcMain.handle('runSync', this.handleRunSync.bind(this));
        ipcMain.handle('localRegister', this.handleLocalRegister.bind(this));
        ipcMain.handle('downloadLog', this.handleDownloadLog.bind(this));
        ipcMain.handle('getSystemInfo', this.handleGetSystemInfo.bind(this));
        ipcMain.handle(
            'clearRegistration',
            this.handleClearRegistration.bind(this),
        );
    }

    private async handleGetDataStore(): Promise<BridgeChannel['getDataStore']> {
        return this.dataStore.dataForRenderer;
    }

    private handleLocalRegister(
        event: IpcMainInvokeEvent,
        args: { token: string; region: Region },
    ): BridgeChannel['localRegister'] {
        this.localRegister(args.token, args.region);
    }

    private handleOpenLink(
        event: IpcMainInvokeEvent,
        url: string,
    ): BridgeChannel['openLink'] {
        shell.openExternal(url);
    }

    private handleChangeLanguage(
        event: IpcMainInvokeEvent,
        locale: string,
    ): BridgeChannel['changeLanguage'] {
        this.dataStore.set('locale', locale);
        IntlHelper.setLocale(locale);
    }

    private handleQuitApp(): BridgeChannel['quitApp'] {
        app.quit();
    }

    private handleRunSync(): BridgeChannel['runSync'] {
        this.handleSync(true);
    }

    private handleClearRegistration(): BridgeChannel['clearRegistration'] {
        this.dataStore.clearData();
    }

    private async handleDownloadLog(): Promise<BridgeChannel['downloadLog']> {
        try {
            await this.dumpDiagnostics();
            const logPath = this.logger.getFilePath();
            shell.showItemInFolder(logPath);
        } catch (err) {
            this.logger.error(err, 'Error processing log file.');
        }
    }

    private async handleGetSystemInfo(): Promise<
        BridgeChannel['getSystemInfo']
    > {
        try {
            return await this.systemQuery();
        } catch (error) {
            this.logger.error(
                error,
                'Error getting system info for diagnostics.',
            );
            throw error;
        }
    }

    private async dumpDiagnostics() {
        try {
            const systemInfo = await this.systemQuery();
            this.logger.info(systemInfo);

            this.logger.info({
                process_info: {
                    execPath: process.execPath,
                    agentUptime: process.uptime(),
                    memoryUsage: process.memoryUsage(),
                    process: process.cpuUsage(),
                    processPriority: os.getPriority(),
                    processId: process.pid,
                    processTitle: process.title,
                    processArgv: process.argv,
                    processEnv: {
                        NODE_ENV: process.env.NODE_ENV,
                        TARGET_ENV: process.env.TARGET_ENV,
                        ELECTRON_IS_DEV: process.env.ELECTRON_IS_DEV,
                    },
                },

                app_info: {
                    winSize: this.sender?.getSize(),
                    contentSize: this.sender?.getContentSize(),
                    winBounds: this.sender?.getBounds(),
                    isVisible: this.sender?.isVisible(),
                    ...this.prepareDataForDiagnostics(
                        this.dataStore.dataForRenderer,
                    ),
                    jobs: SchedulerService.instance.getScheduledJobsInfo(),
                },

                system_info: {
                    platform: os.platform(),
                    platformVersion: os.version(),
                    arch: os.arch(),
                    cpus: os.cpus().length,
                    totalMemory: os.totalmem(),
                    freeMemory: os.freemem(),
                    loadAverage: os.loadavg(),
                    networkInterfaces: Object.keys(os.networkInterfaces()),
                    uptime: os.uptime(),
                },
            });
        } catch (error) {
            this.logger.error(
                error,
                'Error getting system info for diagnostics dump.',
            );
        }
    }

    private prepareDataForDiagnostics(data: any): any {
        const {
            debugInfo,
            appVersion,
            lastCheckedAt,
            syncState,
            region,
            complianceData,
        } = data;

        return {
            debugInfo,
            appVersion,
            lastCheckedAt,
            syncState,
            region,
            complianceData: complianceData?.data,
        };
    }
}
