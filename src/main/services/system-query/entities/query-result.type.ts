export type QueryResult = {
    drataAgentVersion: string;
    platform: 'MACOS' | 'WINDOWS' | 'LINUX';
    rawQueryResults: {
        osVersion: any;
        hwSerial: any;
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
    };
};
