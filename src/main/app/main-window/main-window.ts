import { app, BrowserWindow, Menu, nativeTheme, screen, Tray } from 'electron';
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
    TRAY_ICON_DARK,
    TRAY_ICON_LIGHT,
} from '../../../constants/paths';
import { DataStoreHelper } from '../../helpers/data-store.helper';
import { IntlHelper } from '../../helpers/intl.helper';
import { getDesktopEnvironment } from '../../helpers/platform.helpers';

export class MainWindow {
    private readonly window: BrowserWindow | null = null;
    private readonly tray: Tray | null = null;
    private readonly dataStore: DataStoreHelper;
    private isQuitting = false;
    private useDarkIcon = false;

    static async init({
        isRegistered,
    }: {
        isRegistered: boolean;
    }): Promise<MainWindow> {
        const instance = new MainWindow(isRegistered);
        await instance.loadWindowContent();
        return instance;
    }

    private constructor(isRegistered: boolean) {
        this.dataStore = DataStoreHelper.instance;
        this.useDarkIcon = this.resolveShouldUseDarkIcon();
        this.tray = new Tray(TRAY_ICON_LIGHT);

        // MacOS template image is automatic on background color
        if (!PLATFORM.MACOS) {
            this.setupThemeListener();
            this.updateTrayIcon(); // update initial icon color
        }

        this.window = new BrowserWindow({
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
            show: false,
            frame: false,
            skipTaskbar: true,
        });

        // Hide dock icon on macOS
        if (app.dock) {
            app.dock.hide();
        }

        /**
         * Ubuntu desktop tasks require context menu behavior
         * tray click events are not issued on Ubuntu GNOME icon extensions
         */
        if (!PLATFORM.MACOS) {
            const contextMenu = Menu.buildFromTemplate([
                {
                    label: IntlHelper._t({ id: 'Show Drata Agent' }),
                    click: () => {
                        this.showWindow();
                    },
                },
                { type: 'separator' },
                {
                    label: IntlHelper._t({ id: 'Override Icon Color' }),
                    click: () => {
                        this.useDarkIcon = !this.useDarkIcon;
                        this.dataStore.set('darkIcon', this.useDarkIcon);
                        this.updateTrayIcon();
                    },
                },
                {
                    label: IntlHelper._t({ id: 'Revert Icon to System Theme' }),
                    click: () => {
                        this.dataStore.remove('darkIcon');
                        this.useDarkIcon = this.resolveShouldUseDarkIcon();
                        this.updateTrayIcon();
                    },
                },
                { type: 'separator' },
                {
                    label: IntlHelper._t({ id: 'Quit' }),
                    click: () => {
                        app.quit();
                    },
                },
            ]);

            this.tray.setContextMenu(contextMenu);
        }

        this.tray.setToolTip('Drata Agent');
        this.tray.on('click', () => {
            if (this.window?.isVisible()) {
                this.hideWindow();
            } else {
                this.showWindow();
            }
        });

        this.window.on('blur', () => {
            this.hideWindow();
        });

        this.window.on('close', event => {
            if (!this.isQuitting) {
                event.preventDefault();
                this.hideWindow();
            }
        });

        app.on('before-quit', () => {
            this.isQuitting = true;
        });
    }

    private async loadWindowContent() {
        if (BUILD.PACKED || ENV.PROD) {
            this.window?.loadURL(url.pathToFileURL(MAIN_WINDOW_TEMPLATE).href);
        } else {
            this.window?.loadURL(`http://localhost:${PORT}`);
        }

        // Wait for window to be ready
        await new Promise<void>(resolve => {
            this.window?.webContents.on('did-finish-load', () => {
                // Send initial data store state
                this.window?.webContents.send(
                    'dataStoreUpdate',
                    this.dataStore.dataForRenderer,
                );
                resolve();
            });
        });
    }

    private setupThemeListener() {
        nativeTheme.on('updated', () => {
            this.useDarkIcon = this.resolveShouldUseDarkIcon();
            this.updateTrayIcon();
        });
    }

    private resolveShouldUseDarkIcon() {
        const useDarkIcon = this.dataStore.get('darkIcon');

        if (useDarkIcon != null) return useDarkIcon;

        const isGnome = getDesktopEnvironment()
            ?.toLowerCase()
            .includes('gnome');

        // GNOME should use dark icon for both themes
        return isGnome || nativeTheme.shouldUseDarkColors;
    }

    private updateTrayIcon() {
        this.tray?.setImage(
            this.useDarkIcon ? TRAY_ICON_DARK : TRAY_ICON_LIGHT,
        );
    }

    showWindow() {
        if (!this.window || !this.tray) return;

        // allow fallback to cursor position if tray position is not available
        let trayBounds = this.tray.getBounds();
        if (!trayBounds || (trayBounds.x === 0 && trayBounds.y === 0)) {
            const cursor = screen.getCursorScreenPoint();
            trayBounds = { x: cursor.x, y: cursor.y, width: 0, height: 0 };
        }
        const windowBounds = this.window.getBounds();
        const screenBounds = screen.getPrimaryDisplay().bounds;

        // Position window above the tray icon
        const x = Math.round(
            trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2,
        );
        const y = Math.round(trayBounds.y - windowBounds.height - 10);

        // Ensure window is within screen bounds
        const finalX = Math.min(
            Math.max(x, 0),
            screenBounds.width - windowBounds.width,
        );
        const finalY = Math.min(
            Math.max(y, 0),
            screenBounds.height - windowBounds.height,
        );

        this.window.setPosition(finalX, finalY);
        this.window.show();
    }

    hideWindow() {
        this.window?.hide();
    }

    getWindow() {
        return this.window;
    }
}
