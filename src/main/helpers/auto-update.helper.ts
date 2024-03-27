import { app, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import { isNil } from 'lodash';
import { Menubar } from 'menubar';
import { MainBridge } from '../../bridge/main-bridge';
import { BUILD, PLATFORM } from '../../constants/environment';
import { MessageType } from '../../entities/message-listener-type.enum';
import { Logger } from './logger.helpers';

export class AutoUpdateHelper {
    private readonly logger = new Logger(this.constructor.name);

    private menubar: Menubar;
    private bridge: MainBridge;

    constructor(menubar: Menubar, bridge: MainBridge) {
        this.menubar = menubar;
        this.bridge = bridge;

        autoUpdater.on('checking-for-update', () => {
            this.logger.info('Checking for update.');
        });

        autoUpdater.on('error', err => {
            this.logger.error(err);
        });

        autoUpdater.on('update-available', () => {
            this.logger.info('Update available, downloading...');
        });

        autoUpdater.on('update-not-available', () => {
            this.logger.info('Drata Agent is up to date.');
        });

        autoUpdater.on('update-downloaded', info => {
            if (this.shouldAutoInstall) {
                this.logger.info(
                    'Update downloaded, upgrading in 30 seconds...',
                );
                /**
                 * defer execution to prevent a no-op on electron-updater
                 * https://github.com/electron-userland/electron-builder/issues/1604#issuecomment-306709572
                 */
                setTimeout(() => {
                    this.closeAllWindows();
                    this.logger.info(
                        `Quitting and updating to version ${info.version}`,
                    );
                    autoUpdater.quitAndInstall();
                }, 30000);
            } else {
                this.logger.info(`Update ready for version ${info.version}`);
                this.bridge?.sendMessage('toast', {
                    type: MessageType.INFO,
                    message: {
                        id: 'Drata Agent update required. Please quit the application to install.',
                    },
                });
            }
        });
    }

    async checkForUpdates() {
        if (BUILD.PACKED) {
            // checkForUpdates* protects against repeated executions internally
            if (this.shouldAutoInstall) {
                return autoUpdater.checkForUpdates.bind(autoUpdater)();
            } else {
                // notify user update is ready but don't force installation until manual quit
                return autoUpdater.checkForUpdatesAndNotify.bind(autoUpdater)();
            }
        }

        this.logger.warn("Checking for updates doesn't work on unpacked apps");
    }

    private get shouldAutoInstall(): boolean {
        // only AppImage is seamless auto install
        return !PLATFORM.LINUX || !isNil(process.env.APPIMAGE);
    }

    private closeAllWindows(): void {
        // remove all events that could prevent the a window from closing
        app.removeAllListeners('window-all-closed');
        // hide the window from the menubar
        this.menubar.hideWindow();
        // find all windows and close them
        BrowserWindow.getAllWindows().forEach(_win => _win.close());
        // destroy main window to make sure everything is closed
        this.menubar.window?.destroy();
    }
}
