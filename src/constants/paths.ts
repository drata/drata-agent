import path from 'path';
import { ENV, PLATFORM } from './environment';

const ROOT = path.join(__dirname, '..');
const DIST_FOLDER = path.join(ROOT, 'dist');
const RENDERER_FOLDER = path.join(ROOT, 'src', 'renderer');
const ASSETS = path.join(ROOT, 'src', 'assets');
/**
 * Renderer template
 */
export const MAIN_WINDOW_TEMPLATE = path.join(
    ENV.DEV ? RENDERER_FOLDER : DIST_FOLDER,
    'index.html',
);
/**
 * Bundle for src/bridge/index.ts
 */
export const PRELOAD_SCRIPT = path.join(DIST_FOLDER, 'preload.js');

export const LOCALES = path.join(ASSETS, 'data', 'locales');

export const TRAY_ICON_MAC = path.join(
    ASSETS,
    'tray-icons',
    'IconTemplate.png',
);

export const TRAY_ICON_OTHERS = path.join(
    ASSETS,
    'tray-icons',
    'tray_icon.png',
);

export const TRAY_ICON = PLATFORM.MACOS ? TRAY_ICON_MAC : TRAY_ICON_OTHERS;
