import { app, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import { Menubar } from 'menubar';
import { BUILD, PLATFORM } from '../../constants/environment';
import { Logger } from './logger.helpers';

export class AutoUpdateHelper {
    private readonly logger = new Logger(this.constructor.name);

    private menubar: Menubar;

    constructor(menubar: Menubar) {
        this.menubar = menubar;

        if (!PLATFORM.LINUX) {
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
                        `Quiting and updating to version ${info.version}`,
                    );
                    autoUpdater.quitAndInstall();
                }, 30000);
            });
        }
    }

    async checkForUpdates() {
        if (BUILD.UNPACKED) {
            this.logger.warn(
                "Checking for updates doesn't work on unpacked apps",
            );
        } else if (!PLATFORM.LINUX) {
            return autoUpdater.checkForUpdates.bind(autoUpdater)();
        }
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
