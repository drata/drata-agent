import dotenv from 'dotenv';
import { app } from 'electron';
import { Platform } from '../enums/platform.enum';
import { TargetEnv } from '../enums/target-env.enum';
import { getPlatform } from '../main/helpers/platform.helpers';

dotenv.config();

export const PORT = process.env.PORT || 3000;

const platform = getPlatform();

/**
 * Indicates whether or not the bundles are production ready
 * Not to be cofused with the Drata environments, for that, look at TARGET_ENV
 */
export const ENV: Record<string, boolean> = {
    PROD: process.env.NODE_ENV === 'production',
    DEV: process.env.NODE_ENV === 'development',
};

/**
 * Determines whether the app is packed (ready to install) or not
 */
export const BUILD: Record<string, boolean> = {
    PACKED: app.isPackaged,
    UNPACKED: !app.isPackaged,
};

/**
 * Easily check which platform is the app running at
 */
export const PLATFORM: Record<string, boolean> = {
    MACOS: platform === Platform.MACOS,
    WINDOWS: platform === Platform.WINDOWS,
    LINUX: platform === Platform.LINUX,
};

/**
 * Determines what is the target environment for the API and the locally stored data
 */
export const TARGET_ENV: Record<string, boolean> = {
    LOCAL: process.env.TARGET_ENV === TargetEnv.LOCAL,
    PROD: process.env.TARGET_ENV === TargetEnv.PROD,
    DEV: process.env.TARGET_ENV === TargetEnv.DEV,
    QA: process.env.TARGET_ENV === TargetEnv.QA,
};
