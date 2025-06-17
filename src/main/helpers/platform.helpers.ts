import { platform } from 'os';
import { Platform } from '../../enums/platform.enum';

export const getPlatform = (): Platform => {
    switch (platform()) {
        case 'darwin':
            return Platform.MACOS;
        case 'win32':
            return Platform.WINDOWS;
        case 'cygwin':
        case 'freebsd':
        case 'linux':
        case 'openbsd':
        case 'netbsd':
            return Platform.LINUX;
        default:
            return Platform.UNKNOWN;
    }
};

export const getDesktopEnvironment = (): string | null => {
    const env = process.env;

    if (env.XDG_CURRENT_DESKTOP) return env.XDG_CURRENT_DESKTOP;
    if (env.DESKTOP_SESSION) return env.DESKTOP_SESSION;
    if (env.GDMSESSION) return env.GDMSESSION;

    return null;
};
