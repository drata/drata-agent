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
