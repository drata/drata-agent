import { get as _get } from 'lodash';
import { TargetEnv } from '../enums/target-env.enum';

const COMMON = {
    ui: {
        appWidth: 400,
        appHeight: {
            registered: 528,
            unregistered: 393,
        },
    },
    minHoursSinceLastSync: 24,
    secondsDelaySyncOnStart: 900,
    secondsDelayUpdateCheckOnStart: 300,
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
    sentry: {
        env: 'LOCAL',
        dsn: '',
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
    sentry: {
        env: 'DEV',
        dsn: '',
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
    sentry: {
        env: 'QA',
        dsn: '',
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
    sentry: {
        env: 'PROD',
        dsn: '',
    },
};

// default config option
let _config = LOCAL;

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
    ..._config,
    ...COMMON,
};

export const get = (selector: string) => _get(config, selector);
