import * as dns from 'dns';
import { app, powerMonitor } from 'electron';
import installExtension, { REDUX_DEVTOOLS } from 'electron-devtools-installer';
import { get, isNil } from 'lodash';
import { Menubar } from 'menubar';
import { MainBridge } from '../bridge/main-bridge';
import { config } from '../config';
import { PLATFORM, TARGET_ENV } from '../constants/environment';
import { MessageType } from '../entities/message-listener-type.enum';
import { Message } from '../entities/message.interface';
import { ErrorCode } from '../enums/error-code.enum';
import { HttpStatus } from '../enums/http-status.enum';
import { ProtocolSchema } from '../enums/protocol-schema.enum';
import { Region } from '../enums/region.enum';
import { SyncState } from '../enums/sync-state.enum';
import { DebugInfo } from '../types/debug-info.type';
import { MainWindow } from './app/main-window/main-window';
import { AutoLauncherHelper } from './helpers/auto-launcher.helper';
import { AutoUpdateHelper } from './helpers/auto-update.helper';
import { DataStoreHelper } from './helpers/data-store.helper';
import {
    currentLocalTime,
    hoursSinceDate,
    minutesSinceDate,
} from './helpers/date.helper';
import { IntlHelper as Intl } from './helpers/intl.helper';
import { Logger } from './helpers/logger.helpers';
import { ApiService } from './services/api/api.service';
import { DeepLinkService } from './services/deep-link/deep-link.service';
import { SchedulerService } from './services/scheduler/scheduler.service';
import { SystemQueryFactory } from './services/system-query/system-query.factory';
import { SystemQueryService } from './services/system-query/system-query.service';

/**
 * Due to an issue with some Windows machines,
 * that may be caused by hardware acceleration, we are disabling it.
 * Issue: https://app.clubhouse.io/drata/story/15360/support-accelrobotics-white-screen-on-agent
 */
if (PLATFORM.WINDOWS) {
    app.disableHardwareAcceleration();
}

/**
 * Under some conditions restart or shuting down macOS was interrupted
 * The fix was sugested here https://github.com/electron/electron/issues/230#issuecomment-315708965
 */
if (PLATFORM.MACOS) {
    app.on('before-quit', () => {
        app.exit();
    });
}

class DrataAgent {
    private readonly logger = new Logger(this.constructor.name);
    private readonly dataStore = DataStoreHelper.instance;

    private mb?: Menubar;
    private bridge?: MainBridge;
    private autoUpdate?: AutoUpdateHelper;

    constructor(
        private readonly deepLinkService: DeepLinkService,
        private readonly apiService: ApiService,
        private readonly scheduler: SchedulerService,
        private readonly systemQueryService: SystemQueryService,
    ) {}

    async init(): Promise<DrataAgent | undefined> {
        try {
            await app.whenReady().then(() => {
                dns.setDefaultResultOrder('ipv4first');
            });

            this.installDevTools();

            Intl.init();

            try {
                await AutoLauncherHelper.enable();
            } catch (error: any) {
                this.logger.warn(
                    'Could not modify automatic startup settings.',
                    error?.message,
                );
            }

            this.resolveRunningSyncState(); // shouldn't be running on launch

            const hasAccessToken = !!this.dataStore.get('accessToken');
            const region = this.dataStore
                .get('region')
                ?.replace(/\/$/, '') as Region;

            this.dataStore.set('region', region);

            // Verify if the region was registered before, if not then set the NA region
            if (hasAccessToken && isNil(region)) {
                this.dataStore.set('region', Region.NA);
                this.dataStore.set('capturedProtocol', undefined);
            }

            this.mb = await MainWindow.init({ isRegistered: hasAccessToken });

            if (isNil(this.mb.window)) {
                throw new Error('Missing window object on app initialization.');
            }

            this.bridge = MainBridge.getInstance(
                this.mb.window!,
                this.handleSync.bind(this),
                this.localRegister.bind(this),
            );

            // listen for changes on the data store
            this.dataStore.onChange(data => {
                this.updateAppDimensions();

                // notify the renderer context
                this.bridge?.sendMessage('dataStoreUpdate', data);
            });

            // handle the register agent action
            this.deepLinkService.on(
                ProtocolSchema.AUTH_DRATA_AGENT,
                this.handleAuth(),
            );

            this.dataStore.set('appVersion', app.getVersion());

            // everything that's needed on the renderer context must be ready at this point
            this.bridge.sendMessage('appReady', true);

            /**
             * If the registration call gets captured while the Agent is closed
             * the handleAuth method won't be called. To solve that, we store the
             * captured protocols and here we check if it exists
             */
            const capturedProtocol = this.dataStore.get('capturedProtocol');
            if (
                !isNil(capturedProtocol) &&
                capturedProtocol.protocolSchema === 'auth-drata-agent'
            ) {
                // remove the stored data so it won't be used next time the Agent starts
                this.dataStore.set('capturedProtocol', undefined);
                await this.handleAuth()(capturedProtocol.args);
            }

            this.logger.info(
                `Drata Agent v${app.getVersion()} started. © 2023 Drata Inc. All rights reserved.`,
            );

            // collect important info for debugging
            const debugInfo = await this.systemQueryService.getDebugInfo();
            this.dataStore.set('debugInfo', debugInfo as DebugInfo);
            this.logger.info('Debug info:', debugInfo);

            // if not registered greet the users to have them doing that
            if (!hasAccessToken) {
                await this.mb.showWindow();
            }

            // prepare graceful shutdown of scheduler on application events
            // we stop jobs on suspend to prevent them from waking the device
            // this will not stop jobs already running
            app.on('before-quit', this.scheduler.stopAllJobs.bind(this));
            powerMonitor.on('suspend', this.scheduler.stopAllJobs.bind(this));
            powerMonitor.on('resume', () => {
                this.resolveRunningSyncState(); // allow new sync on resume
                setTimeout(() => {
                    this.scheduler.startAllJobs();
                }, Math.max(config.secondsDelaySyncOnStart, config.secondsDelayUpdateCheckOnStart));
            });

            // run and schedule app auto update
            this.autoUpdate = new AutoUpdateHelper(this.mb, this.bridge);
            setTimeout(
                this.scheduler.scheduleAndRunJob.bind(this, {
                    hours: config.hoursUpdateCheck,
                    id: 'check-for-updates',
                    action: this.autoUpdate.checkForUpdates.bind(
                        this.autoUpdate,
                    ),
                }),
                config.secondsDelayUpdateCheckOnStart * 1000,
            );

            // run and schedule sync
            setTimeout(async () => {
                this.scheduler.scheduleAndRunJob({
                    hours: config.hoursSyncCheck,
                    id: 'sync',
                    action: this.handleSync.bind(this),
                });
            }, config.secondsDelaySyncOnStart * 1000);

            return this;
        } catch (error) {
            this.logger.error(error);
        }
    }

    private resolveRunningSyncState() {
        if (this.dataStore.get('syncState') === SyncState.RUNNING) {
            this.dataStore.set('syncState', SyncState.UNKNOWN);
            this.logger.warn('Reset sync to unknown.');
        }
    }

    private installDevTools() {
        if (!TARGET_ENV.PROD) {
            installExtension(REDUX_DEVTOOLS)
                .then(name => this.logger.info(`Added Extension:  ${name}`))
                .catch(err => this.logger.error(err));
        }
    }

    private updateAppDimensions() {
        const hasAccessToken = !!this.dataStore.get('accessToken');

        const bounds = this.mb?.window?.getBounds();

        const newHeight = hasAccessToken
            ? config.ui.appHeight.registered
            : config.ui.appHeight.unregistered;

        if (bounds?.height !== newHeight) {
            this.mb?.window?.setBounds({
                height: newHeight,
            });
        }
    }

    private async handleSync(manualRun = false) {
        try {
            if (manualRun === true || this.shouldRunSync) {
                const hasAccessToken = this.dataStore.get('accessToken');
                if (!hasAccessToken) {
                    return;
                }

                // check data available for sync e.g. first run
                if (!this.dataStore.isInitDataReady) {
                    this.logger.info('Fetching initialization data.');
                    await this.apiService.initialData();
                    this.logger.info(
                        'Initialization data successfully fetched.',
                    );
                }

                this.dataStore.set('lastSyncAttemptedAt', currentLocalTime());
                this.dataStore.set('syncState', SyncState.RUNNING);

                this.logger.info('System query started.');
                const queryResults =
                    await this.systemQueryService.getSystemInfo();
                queryResults.manualRun = manualRun;
                this.logger.info('System query successfully completed.');

                this.logger.info('Sending query results.');
                await this.apiService.sync(queryResults);
                this.logger.info('Query results successfully sent.');

                this.dataStore.set('syncState', SyncState.SUCCESS);
            }
        } catch (error) {
            this.dataStore.set('syncState', SyncState.ERROR);

            await this.handleApiError(
                error,
                'Unable to update your system information at this moment. Please contact your system administrator.',
            );
        }
    }

    private async localRegister(token: string, region: Region): Promise<void> {
        try {
            await this.handleAuth()({ token, region });
        } catch (error) {
            this.logger.error(error);
        }
    }

    private get shouldRunSync(): boolean {
        // don't sync while already in progress
        if (this.dataStore.get('syncState') === SyncState.RUNNING) {
            this.logger.info('Sync aborted due to sync already in progress.');
            return false;
        }

        // limit sync based on last attempted request (regardless if it was successful)
        const lastAttemptTimeStamp = this.dataStore.get('lastSyncAttemptedAt');
        if (!isNil(lastAttemptTimeStamp)) {
            const lastAttemptedAt = new Date(lastAttemptTimeStamp);
            if (
                minutesSinceDate(lastAttemptedAt) <
                config.minMinutesBetweenSyncs
            ) {
                this.logger.info(
                    `Sync aborted. Last attempted at ${lastAttemptedAt.toLocaleString()}.`,
                );
                return false;
            }
        }

        // limit runs based on last known successful sync
        const lastCheckedAtTimeStamp = this.dataStore.get('lastCheckedAt');
        if (isNil(lastCheckedAtTimeStamp)) {
            return true;
        }

        const lastCheckedAt = new Date(lastCheckedAtTimeStamp);
        if (hoursSinceDate(lastCheckedAt) < config.minHoursSinceLastSync) {
            this.logger.info(
                `Sync aborted. Last success at ${lastCheckedAt.toLocaleString()}.`,
            );
            return false;
        }

        return true;
    }

    private handleAuth() {
        return async ({ token, region }: Record<string, any>) => {
            try {
                if (isNil(token)) {
                    throw new Error(
                        'Missing token while handling authentication.',
                    );
                }

                if (isNil(region)) {
                    throw new Error(
                        'Missing region while handling authentication.',
                    );
                }

                // Save region to data store from protocol
                this.dataStore.set('region', region);

                await this.apiService.loginWithMagicLink(token);

                const queryResults =
                    await this.systemQueryService.getAgentDeviceIdentifiers();
                await this.apiService.register(queryResults);

                await this.mb?.showWindow();

                this.logger.info(
                    `Drata Agent successfully registered for the email: ${
                        this.dataStore.get('user')?.email
                    }`,
                );

                this.bridge?.sendMessage('toast', {
                    type: MessageType.SUCCESS,
                    message: {
                        id: 'Drata Agent successfully registered',
                    },
                });

                setTimeout(async () => {
                    await this.handleSync();
                }, 0);
            } catch (error) {
                await this.handleApiError(
                    error,
                    'Unable to login at this time. Please contact your system administrator.',
                );
            }
        };
    }

    private async handleApiError(error: any, defaultMessage: string) {
        const status = get(error, 'response.data.statusCode');
        const code = get(error, 'response.data.code');
        const hasAccessToken = !!this.dataStore.get('accessToken');

        this.logger.error(error);

        let messageType = MessageType.ERROR;
        let errorMessage = defaultMessage;
        let errorSecondaryMessage: string | undefined;
        let navigationCta: Message['navigationCta'];

        let handledByCode = false;
        let isAuthorized = true;

        if (!isNil(code)) {
            handledByCode = true;

            switch (code) {
                case ErrorCode.MAGIC_TOKEN_NOT_FOUND:
                    // Bussiness logic: https://drata.atlassian.net/secure/RapidBoard.jspa?rapidView=12&modal=detail&selectedIssue=ENG-5079&assignee=60dc98537d016900702de30b
                    if (hasAccessToken) {
                        messageType = MessageType.WARNING;
                        errorMessage =
                            "You've already registered the Drata Agent.";
                        errorSecondaryMessage = 'No further action required.';
                    } else {
                        messageType = MessageType.INFO;
                        errorMessage = 'You need to register the Drata Agent.';
                        errorSecondaryMessage =
                            'Go to My Drata, open the "Install the Drata Agent" section and click the "Register Drata Agent" button.';
                        navigationCta = {
                            title: 'Take me to My Drata',
                            url: `${config.url.webApp}/employee/install-agent`,
                        };
                        isAuthorized = false;
                    }
                    break;
                case ErrorCode.REFRESH_TOKEN_NOT_FOUND:
                    messageType = MessageType.INFO;
                    errorMessage = 'You need to register the Drata Agent.';
                    errorSecondaryMessage =
                        'Go to My Drata, open the "Install the Drata Agent" section and click the "Register Drata Agent" button.';
                    navigationCta = {
                        title: 'Take me to My Drata',
                        url: `${config.url.webApp}/employee/install-agent`,
                    };
                    isAuthorized = false;
                    break;
                case ErrorCode.TOKEN_EXPIRED:
                    messageType = MessageType.WARNING;
                    errorMessage = 'The authorization has expired.';
                    errorSecondaryMessage =
                        'Go to My Drata, open the "Install the Drata Agent" section and click the "Register Drata Agent" button.';
                    navigationCta = {
                        title: 'Take me to My Drata',
                        url: `${config.url.webApp}/employee/install-agent`,
                    };
                    isAuthorized = false;
                    break;
                case ErrorCode.ACCOUNT_PENDING:
                    messageType = MessageType.INFO;
                    errorMessage =
                        'We are completing your account configuration.';
                    errorSecondaryMessage =
                        'Please try again in a few minutes.';
                    break;
                case ErrorCode.ACCOUNT_MAINTENANCE:
                    messageType = MessageType.INFO;
                    errorMessage =
                        'We are making Drata even better than before.';
                    errorSecondaryMessage =
                        'Please try again in a few minutes.';
                    break;
                case ErrorCode.ACCOUNT_ADMIN_DISABLED:
                case ErrorCode.ACCOUNT_NON_PAYMENT:
                case ErrorCode.ACCOUNT_USER_DELETED:
                    messageType = MessageType.ERROR;
                    errorMessage = "Your company's account is disabled.";
                    errorSecondaryMessage =
                        'If you believe this is an error, please contact your system administrator.';
                    isAuthorized = false;
                    break;
                default:
                    handledByCode = false;
                    break;
            }
        }

        if (!handledByCode && !isNil(status)) {
            switch (status) {
                case HttpStatus.UNAUTHORIZED:
                    messageType = MessageType.ERROR;
                    errorMessage = 'The Drata Agent is not authorized.';
                    errorSecondaryMessage =
                        'Go to My Drata, open the "Install the Drata Agent" section and click the "Register Drata Agent" button.';
                    navigationCta = {
                        title: 'Take me to My Drata',
                        url: `${config.url.webApp}/employee/install-agent`,
                    };
                    isAuthorized = false;
                    break;
                case HttpStatus.PRECONDITION_FAILED:
                    messageType = MessageType.WARNING;
                    errorMessage = 'You are not registered.';
                    errorSecondaryMessage =
                        'You must first register your workstation before sending data. Go to My Drata, open the "Install the Drata Agent" section and click the "Register Drata Agent" button.';
                    navigationCta = {
                        title: 'Take me to My Drata',
                        url: `${config.url.webApp}/employee/install-agent`,
                    };
                    isAuthorized = false;
                    break;
                default:
                    break;
            }
        }

        if (!isAuthorized) {
            this.dataStore.clearData();
        }

        await this.mb?.showWindow();

        this.bridge?.sendMessage('toast', {
            type: messageType,
            message: {
                id: errorMessage,
            },
            secondaryMessage: !isNil(errorSecondaryMessage)
                ? {
                      id: errorSecondaryMessage,
                  }
                : undefined,
            navigationCta,
        });
    }
}

(async function () {
    try {
        // Init app and store a reference on global
        // to prevent it from being garbage collected
        // @ts-ignore
        global.appInstance = await new DrataAgent(
            new DeepLinkService(),
            new ApiService(),
            SchedulerService.instance,
            SystemQueryFactory.getService(),
        ).init();
    } catch (error: any) {
        // try to log the error back where possible
        new Logger('main').error(error);
    }
})();
