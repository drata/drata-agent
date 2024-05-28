import { ScreenLockSetting } from './screen-lock-setting-interface';

export type QueryResult = {
    drataAgentVersion: string;
    platform: 'MACOS' | 'WINDOWS' | 'LINUX';
    manualRun?: boolean;
    rawQueryResults: {
        osVersion: any;
        hwSerial: any;
        boardSerial?: any;
        boardModel?: any;
        computerName?: any;
        hostName?: any;
        localHostName?: any;
        hwModel: any;
        appList: any;
        winAvStatus?: string;
        winServicesList?: Array<{
            name: string;
            description: string;
            status: string;
            start_type: string;
        }>;
        firewallStatus: any;
        browserExtensions: any;
        macAddress: any;
        autoUpdateEnabled: any;
        adminUsers: any;
        processor: any;
        memory: any;
        hddSize: any;
        hddEncryptionStatus?: any;
        fileVaultEnabled?: any;
        gateKeeperEnabled?: any;
        screenLockStatus?: any;
        graphics?: any;
        locationServices?: any;
        screenLockSettings?: ScreenLockSetting;
    };
};
