import * as dns from 'dns';
import { app, dialog, powerMonitor } from 'electron';
import installExtension, { REDUX_DEVTOOLS } from 'electron-devtools-installer';
import { get, isEmpty, isNil } from 'lodash';
import { MainBridge } from '../bridge/main-bridge';
import { config } from '../config';
import { PLATFORM, TARGET_ENV } from '../constants/environment';
import { MessageType } from '../entities/message-listener-type.enum';
import { Message } from '../entities/message.interface';
import { ErrorCode } from '../enums/error-code.enum';
import { HttpStatus } from '../enums/http-status.enum';
import { LANGUAGE_ENUM } from '../enums/language.enum';
import { ProtocolSchema } from '../enums/protocol-schema.enum';
import { Region } from '../enums/region.enum';
import { SyncState } from '../enums/sync-state.enum';
import { DEFAULT_LOCALE } from '../shared/intl.config';
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
import { IntlHelper } from './helpers/intl.helper';
import { Logger } from './helpers/logger.helpers';
import { ApiService } from './services/api/api.service';
import { DeepLinkService } from './services/deep-link/deep-link.service';
import { SchedulerService } from './services/scheduler/scheduler.service';
import { SystemQueryFactory } from './services/system-query/system-query.factory';
import { SystemQueryService } from './services/system-query/system-query.service';

/**
 * Platform-specific configurations
 * - Linux: Set GTK version to 3 and disable hardware acceleration to prevent issues
 * - Windows: Disable hardware acceleration to prevent issues on some machines
 * - macOS: Ensure proper app exit handling
 */
if (PLATFORM.LINUX) {
    app.commandLine.appendSwitch('gtk-version', '3');
    app.disableHardwareAcceleration();
} else if (PLATFORM.WINDOWS) {
    app.disableHardwareAcceleration();
} else if (PLATFORM.MACOS) {
    app.on('before-quit', () => {
        app.exit();
    });
}

class DrataAgent {
    private autoUpdate?: AutoUpdateHelper;
    private mainWindow?: MainWindow;
    private bridge?: MainBridge;

    constructor(
        private readonly deepLinkService: DeepLinkService,
        private readonly apiService: ApiService,
        private readonly scheduler: SchedulerService,
        private readonly systemQueryService: SystemQueryService,
        private readonly logger: Logger,
        private readonly dataStore: DataStoreHelper,
    ) {}

    async init(): Promise<DrataAgent | undefined> {
        try {
            await app.whenReady().then(() => {
                dns.setDefaultResultOrder('ipv4first');
            });

            this.installDevTools();

            try {
                await AutoLauncherHelper.enable();
            } catch (error: any) {
                this.logger.warn(
                    'Could not modify automatic startup settings.',
                    error?.message,
                );
            }

            this.resolveRunningSyncState(); // shouldn't be running on launch

            // Initialize and clean up startup state
            const hasAccessToken = !!this.dataStore.get('accessToken');
            const locale = this.dataStore.get('locale') ?? DEFAULT_LOCALE;

            // some browsers keep trailing slash on protocol registration
            const region = this.dataStore
                .get('region')
                ?.replace(/\/$/, '') as Region;
            this.setRegion(region);

            IntlHelper.setLocale(locale);

            // Initialize the bridge before creating the window
            this.bridge = MainBridge.getInstance(
                null as any, // We'll update this after window creation
                this.handleSync.bind(this),
                this.localRegister.bind(this),
                this.systemQueryService.getSystemInfo.bind(
                    this.systemQueryService,
                ),
            );

            this.mainWindow = await MainWindow.init({
                isRegistered: hasAccessToken,
            });

            if (isNil(this.mainWindow.getWindow())) {
                throw new Error('Missing window object on app initialization.');
            }

            // Update the bridge with the window reference
            this.bridge = MainBridge.getInstance(
                this.mainWindow.getWindow(),
                this.handleSync.bind(this),
                this.localRegister.bind(this),
                this.systemQueryService.getSystemInfo.bind(
                    this.systemQueryService,
                ),
            );

            // Open DevTools automatically when app starts
            if (!TARGET_ENV.PROD && process.env.OPEN_DEVTOOLS === 'true') {
                this.mainWindow
                    .getWindow()
                    ?.webContents.openDevTools({ mode: 'detach' });
            }

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
             * the handleAuth method won't be called. To solve that, we look
             * for any stored captured protocols.
             */
            const capturedProtocol = this.dataStore.get('capturedProtocol');
            if (capturedProtocol?.protocolSchema === 'auth-drata-agent') {
                await this.handleAuth()(capturedProtocol.args);
            }

            this.logger.info(
                `Drata Agent v${app.getVersion()} started. © 2025 Drata Inc. All rights reserved.`,
            );

            // collect important info for debugging
            const debugInfo = await this.systemQueryService.getDebugInfo();
            this.dataStore.set('debugInfo', debugInfo as DebugInfo);
            this.logger.info('Debug info:', debugInfo);

            // if not registered greet the user
            if (!hasAccessToken) {
                this.mainWindow.showWindow();
            }

            // prepare graceful shutdown of scheduler on application events
            // we stop jobs on suspend to prevent them from waking the device
            // this will not stop jobs already running
            app.on('before-quit', this.scheduler.stopAllJobs.bind(this));
            powerMonitor.on('suspend', this.scheduler.stopAllJobs.bind(this));
            powerMonitor.on('resume', () => {
                this.resolveRunningSyncState(); // allow new sync on resume
                setTimeout(
                    () => {
                        this.scheduler.startAllJobs();
                    },
                    Math.max(
                        config.secondsDelaySyncOnStart,
                        config.secondsDelayUpdateCheckOnStart,
                    ) * 1000,
                );
            });

            // run and schedule app auto update
            this.autoUpdate = new AutoUpdateHelper(
                this.mainWindow,
                this.bridge,
            );
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
            throw error;
        }
    }

    private setRegion(region: Region) {
        if (!isEmpty(this.dataStore.get('accessToken'))) {
            this.logger.warn('Already registered, cannot change region.');
            return;
        }
        this.dataStore.set('region', region);
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
                .then(({ name, url }) =>
                    this.logger.info(`Added Extension: ${name} (${url})`),
                )
                .catch(err => this.logger.error(err));
        }
    }

    private updateAppDimensions() {
        const hasAccessToken = !!this.dataStore.get('accessToken');

        const bounds = this.mainWindow?.getWindow()?.getBounds();

        const newHeight = hasAccessToken
            ? config.ui.appHeight.registered
            : config.ui.appHeight.unregistered;

        if (bounds?.height !== newHeight) {
            this.mainWindow?.getWindow()?.setBounds({
                height: newHeight,
            });
        }
    }

    private async handleSync(manualRun = false) {
        try {
            if (manualRun === true || this.shouldRunSync) {
                if (!this.dataStore.get('accessToken')) {
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
                IntlHelper._t({
                    id: 'Unable to update your system information at this moment. Please contact your system administrator.',
                }),
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
                // only allow captured protocols once
                this.dataStore.remove('capturedProtocol');

                if (isNil(token)) {
                    throw new Error(
                        IntlHelper._t({
                            id: 'Missing token while handling authentication.',
                        }),
                    );
                }

                if (isNil(region)) {
                    throw new Error(
                        IntlHelper._t({
                            id: 'Missing region while handling authentication.',
                        }),
                    );
                }

                if (this.dataStore.get('accessToken')) {
                    throw new Error(
                        IntlHelper._t({
                            id: "You've already registered the Drata Agent. Disconnect the device first.",
                        }),
                    );
                }

                // Save region to auth api call
                this.setRegion(region);

                await this.apiService.loginWithMagicLink(token);

                const queryResults =
                    await this.systemQueryService.getAgentDeviceIdentifiers();
                await this.apiService.register(queryResults);

                // Reload intl configuration with user's language preference
                if (!this.dataStore.get('locale')) {
                    const userLanguage =
                        LANGUAGE_ENUM[
                            this.dataStore.get('user')
                                ?.language as keyof typeof LANGUAGE_ENUM
                        ];
                    this.logger.info('Setting Locale to:', userLanguage);
                    this.dataStore.set('locale', userLanguage);
                    IntlHelper.setLocale(userLanguage);
                }

                this.mainWindow?.showWindow();

                this.logger.info(
                    `Drata Agent successfully registered for the email: ${
                        this.dataStore.get('user')?.email
                    }`,
                );

                this.bridge?.sendMessage('toast', {
                    type: MessageType.SUCCESS,
                    message: {
                        id: IntlHelper._t({
                            id: 'Drata Agent successfully registered',
                        }),
                    },
                });

                setTimeout(async () => {
                    await this.handleSync();
                }, 0);
            } catch (error: unknown) {
                await this.handleApiError(
                    error,
                    error instanceof Error
                        ? error.message
                        : IntlHelper._t({
                              id: 'Unable to login at this time. Please contact your system administrator.',
                          }),
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
                        errorMessage = IntlHelper._t({
                            id: "You've already registered the Drata Agent.",
                        });
                        errorSecondaryMessage = 'No further action required.';
                    } else {
                        messageType = MessageType.INFO;
                        errorMessage = IntlHelper._t({
                            id: 'You need to register the Drata Agent.',
                        });
                        errorSecondaryMessage = IntlHelper._t({
                            id: 'Go to My Drata, open the "Install the Drata Agent" section and click the "Register Drata Agent" button.',
                        });
                        navigationCta = {
                            title: IntlHelper._t({ id: 'Take me to My Drata' }),
                            url: `${config.url.webApp}/employee/install-agent`,
                        };
                        isAuthorized = false;
                    }
                    break;
                case ErrorCode.REFRESH_TOKEN_NOT_FOUND:
                    messageType = MessageType.INFO;
                    errorMessage = IntlHelper._t({
                        id: 'You need to register the Drata Agent.',
                    });
                    errorSecondaryMessage = IntlHelper._t({
                        id: 'Go to My Drata, open the "Install the Drata Agent" section and click the "Register Drata Agent" button.',
                    });
                    navigationCta = {
                        title: IntlHelper._t({ id: 'Take me to My Drata' }),
                        url: `${config.url.webApp}/employee/install-agent`,
                    };
                    isAuthorized = false;
                    break;
                case ErrorCode.TOKEN_EXPIRED:
                    messageType = MessageType.WARNING;
                    errorMessage = IntlHelper._t({
                        id: 'The authorization has expired.',
                    });
                    errorSecondaryMessage = IntlHelper._t({
                        id: 'Go to My Drata, open the "Install the Drata Agent" section and click the "Register Drata Agent" button.',
                    });
                    navigationCta = {
                        title: IntlHelper._t({ id: 'Take me to My Drata' }),
                        url: `${config.url.webApp}/employee/install-agent`,
                    };
                    isAuthorized = false;
                    break;
                case ErrorCode.ACCOUNT_PENDING:
                    messageType = MessageType.INFO;
                    errorMessage = IntlHelper._t({
                        id: 'We are completing your account configuration.',
                    });
                    errorSecondaryMessage = IntlHelper._t({
                        id: 'Please try again in a few minutes.',
                    });
                    break;
                case ErrorCode.ACCOUNT_MAINTENANCE:
                    messageType = MessageType.INFO;
                    errorMessage = IntlHelper._t({
                        id: 'We are making Drata even better than before.',
                    });
                    errorSecondaryMessage = IntlHelper._t({
                        id: 'Please try again in a few minutes.',
                    });
                    break;
                case ErrorCode.AGENT_ALERT:
                    messageType = MessageType.INFO;
                    errorMessage = get(error, 'response.data.message');
                    errorSecondaryMessage = get(
                        error,
                        'response.data.secondaryMessage',
                    );
                    break;
                case ErrorCode.ACCOUNT_ADMIN_DISABLED:
                case ErrorCode.ACCOUNT_NON_PAYMENT:
                    // These may be temporary after working with support, so don't deauthorize client
                    messageType = MessageType.ERROR;
                    errorMessage = "Your company's account is disabled.";
                    errorSecondaryMessage =
                        'If you believe this is an error, please contact your system administrator.';
                    break;
                case ErrorCode.ACCOUNT_USER_DELETED:
                    messageType = MessageType.ERROR;
                    errorMessage = 'Your user account was deleted.';
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
                    errorMessage = IntlHelper._t({
                        id: 'The Drata Agent is not authorized.',
                    });
                    errorSecondaryMessage = IntlHelper._t({
                        id: 'Go to My Drata, open the "Install the Drata Agent" section and click the "Register Drata Agent" button.',
                    });
                    navigationCta = {
                        title: IntlHelper._t({ id: 'Take me to My Drata' }),
                        url: `${config.url.webApp}/employee/install-agent`,
                    };
                    isAuthorized = false;
                    break;
                case HttpStatus.PRECONDITION_FAILED:
                    // This may be temporary after working with support, so we don't want to show an error message
                    return;
                default:
                    break;
            }
        }

        if (!isAuthorized) {
            this.dataStore.clearData();
        }

        this.mainWindow?.showWindow();

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
        // Reference on global to prevent garbage collection
        (global as any).appInstance = await new DrataAgent(
            new DeepLinkService(),
            new ApiService(),
            SchedulerService.instance,
            SystemQueryFactory.getService(),
            new Logger('main'),
            DataStoreHelper.instance,
        ).init();
    } catch (error: unknown) {
        dialog.showErrorBox('Drata Agent', String(error));
        app.exit(1);
    }
})();
