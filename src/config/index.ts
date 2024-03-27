import { get as _get } from 'lodash';
import { TargetEnv } from '../enums/target-env.enum';

type AgentConfig = typeof DEV | typeof QA | typeof PROD | typeof LOCAL;

const DEFAULT = {
    ui: {
        appWidth: 400,
        appHeight: {
            registered: 528,
            unregistered: 393,
        },
    },
    hoursSyncCheck: 2, // auto only
    hoursUpdateCheck: 1,
    minHoursSinceLastSync: 24, // auto only, last success
    minMinutesBetweenSyncs: 15, // auto only, last atttempt (based on 1 hour sync check interval)
    secondsDelaySyncOnStart: 900,
    secondsDelayUpdateCheckOnStart: 300,
    datadog: {
        // Only track errors / issues / manual events
        // DD RUM SDK works within renderer process, will push user error events up as needed
        // https://docs.datadoghq.com/real_user_monitoring/guide/monitor-electron-applications-using-browser-sdk/
        applicationId: '27cfcb76-e3e9-4a78-87bb-76c865267f4c',
        clientToken: 'pubeb5e7e5d161da9039404a813fe95f503',
        site: 'datadoghq.com',
        service: 'drata-agent',
        sessionSampleRate: 100,
        sessionReplaySampleRate: 0,
        allowFallbackToLocalStorage: true,
        trackUserInteractions: false,
        trackViewsManually: true,
        trackResources: true,
        trackLongTasks: true,
        compressIntakeRequests: true,
        silentMultipleInit: true,
        defaultPrivacyLevel: 'mask-user-input',
    },
}; // keep second delays < 1 hour and at least 5 minutes apart to prevent conflicts (run update first)

const LOCAL = {
    url: {
        marketingApp: 'http://localhost:4000',
        webApp: 'http://localhost:5000',
        adminApp: 'http://localhost:8000',
        api: 'http://localhost:3000',
        drataAdditionalFramework: 'https://drata.com',
        help: 'https://help.drata.com/',
    },
    datadog: {
        ...DEFAULT.datadog,
        env: 'local',
    },
};

const DEV = {
    url: {
        marketingApp: 'https://dev.drata.com',
        webApp: 'https://app.dev.drata.com',
        adminApp: 'https://admin.dev.drata.com',
        api: 'https://api.dev.drata.com',
        drataAdditionalFramework: 'https://drata.com',
        help: 'https://help.drata.com/',
    },
    datadog: {
        ...DEFAULT.datadog,
        env: 'dev',
    },
};

const QA = {
    url: {
        marketingApp: 'https://qa.drata.com',
        webApp: 'https://app.qa.drata.com',
        adminApp: 'https://admin.qa.drata.com',
        api: 'https://api.qa.drata.com',
        drataAdditionalFramework: 'https://drata.com',
        help: 'https://help.drata.com/',
    },
    datadog: {
        ...DEFAULT.datadog,
        env: 'qa',
    },
};

const PROD = {
    url: {
        marketingApp: 'https://drata.com',
        webApp: 'https://app.drata.com',
        adminApp: 'https://admin.drata.com',
        api: 'https://api.drata.com',
        drataAdditionalFramework: 'https://drata.com',
        help: 'https://help.drata.com/',
    },
    datadog: {
        ...DEFAULT.datadog,
        env: 'prod',
    },
};

// default config option
let _config: AgentConfig = LOCAL;

switch (process.env.TARGET_ENV) {
    case TargetEnv.DEV:
        _config = DEV;
        break;
    case TargetEnv.QA:
        _config = QA;
        break;
    case TargetEnv.PROD:
        _config = PROD;
        break;
    default:
        _config = LOCAL;
        break;
}

export const config = {
    ...DEFAULT,
    ..._config,
};

export const get = (selector: string) => _get(config, selector);
