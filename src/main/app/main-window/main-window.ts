import { app, Menu, Tray } from 'electron';
import { Menubar, menubar } from 'menubar';
import { Options } from 'menubar/lib/types';
import url from 'url';
import { config } from '../../../config';
import {
    BUILD,
    ENV,
    PLATFORM,
    PORT,
    TARGET_ENV,
} from '../../../constants/environment';
import {
    MAIN_WINDOW_TEMPLATE,
    PRELOAD_SCRIPT,
    TRAY_ICON,
} from '../../../constants/paths';
import { IntlHelper as Intl } from '../../helpers/intl.helper';

export class MainWindow {
    static async init({
        isRegistered,
    }: {
        isRegistered: boolean;
    }): Promise<Menubar> {
        return new Promise((resolve, reject) => {
            try {
                const tray = new Tray(TRAY_ICON);

                const options: Partial<Options> = {
                    tray,
                    preloadWindow: true,
                    showDockIcon: false,
                    showOnAllWorkspaces: false,
                    browserWindow: {
                        width: config.ui.appWidth,
                        height: isRegistered
                            ? config.ui.appHeight.registered
                            : config.ui.appHeight.unregistered,
                        webPreferences: {
                            nodeIntegration: false,
                            contextIsolation: true,
                            preload: PRELOAD_SCRIPT,
                            devTools: !TARGET_ENV.PROD,
                            sandbox: true,
                        },
                        resizable: !TARGET_ENV.PROD,
                    },
                    index:
                        BUILD.PACKED || ENV.PROD
                            ? url.pathToFileURL(MAIN_WINDOW_TEMPLATE).href
                            : `http://localhost:${PORT}`,
                };

                const mb = menubar(options);

                /**
                 * This is necessary to hide the dock Icon on Mac
                 * https://github.com/maxogden/menubar/issues/306
                 */
                mb.on('after-create-window', () => {
                    app.dock?.hide();
                });

                mb.on('ready', () => {
                    if (PLATFORM.LINUX) {
                        const contextMenu = Menu.buildFromTemplate([
                            {
                                label: Intl.translate({
                                    id: 'Open Drata Agent',
                                }),
                                click: function () {
                                    mb.showWindow();
                                },
                            },
                            {
                                label: Intl.translate({
                                    id: 'Quit Drata',
                                }),
                                click: function () {
                                    app.quit();
                                },
                            },
                        ]);
                        tray.setToolTip(
                            Intl.translate({
                                id: 'Drata Agent',
                            }),
                        );
                        tray.setContextMenu(contextMenu);
                    }

                    resolve(mb);
                });
            } catch (error) {
                reject(error);
            }
        });
    }
}
