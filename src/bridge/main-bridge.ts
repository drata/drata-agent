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
import { Logger } from '../main/helpers/logger.helpers';
import { SchedulerService } from '../main/services/scheduler/scheduler.service';
export class MainBridge {
    static instance: MainBridge;
    private sender: BrowserWindow;
    private readonly logger = new Logger(this.constructor.name);
    private dataStore = DataStoreHelper.instance;

    static getInstance(
        win: BrowserWindow,
        handleSync: (manualRun: boolean) => void,
        localRegister: (token: string, region: Region) => void,
    ) {
        if (isNil(MainBridge.instance)) {
            MainBridge.instance = new MainBridge(
                win,
                handleSync,
                localRegister,
            );
        }
        return MainBridge.instance;
    }

    private constructor(
        win: BrowserWindow,
        private readonly handleSync: (manualRun: boolean) => void,
        private readonly localRegister: (token: string, region: Region) => void,
    ) {
        this.sender = win;

        this.initHanders();
    }

    private initHanders() {
        ipcMain.handle('getDataStore', this.handleGetDataStore.bind(this));
        ipcMain.handle('openLink', this.handleOpenLink.bind(this));
        ipcMain.handle('hideApp', this.handleHideApp.bind(this));
        ipcMain.handle('allowResize', this.handleAllowResize.bind(this));
        ipcMain.handle(
            'dumpDiagnostics',
            this.handleDumpDiagnostics.bind(this),
        );
        ipcMain.handle('quitApp', this.handleQuitApp.bind(this));
        ipcMain.handle('runSync', this.handleRunSync.bind(this));
        ipcMain.handle('localRegister', this.handleLocalRegister.bind(this));
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

    private handleHideApp(): BridgeChannel['hideApp'] {
        this.sender.hide();
        app.dock.hide();
    }

    private handleAllowResize(): BridgeChannel['allowResize'] {
        this.sender.resizable = true;
    }

    private handleDumpDiagnostics(): BridgeChannel['dumpDiagnostics'] {
        try {
            this.logger.info('Dumping diagnostic information...');
            this.logger.info({
                execPath: process.execPath,
                features: process.features,
                nodeVer: process.version,
                winSize: this.sender?.getSize(),
                contentSize: this.sender?.getContentSize(),
                ...this.prepareDataForDiagnostics(
                    this.dataStore.dataForRenderer,
                ),
                platform: os.platform(),
                platformVersion: os.version(),
                processPriority: os.getPriority(),
                uptime: os.uptime(),
                jobs: SchedulerService.instance.getScheduledJobsInfo(),
                nodeConfig: {
                    execArgv: process.execArgv,
                    argv: process.argv,
                    config: process.config,
                },
            });
        } catch (err) {
            this.logger.error(err, 'Error dumping diagnostics');
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

    private handleQuitApp(): BridgeChannel['quitApp'] {
        app.quit();
    }

    private handleRunSync(): BridgeChannel['runSync'] {
        this.handleSync(true);
    }

    sendMessage<BCh extends keyof BridgeChannel>(
        channel: BCh,
        data: BridgeChannel[BCh],
    ) {
        this.sender.webContents.send(channel.toString(), data);
    }
}
