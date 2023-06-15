const getPlatform = (platform: string): string => {
    switch (platform) {
        case 'darwin':
            return 'macOS';
        case 'win32':
            return 'Windows';
        case 'cygwin':
        case 'freebsd':
        case 'linux':
        case 'openbsd':
        case 'netbsd':
            return 'Linux';
        case 'aix':
        case 'sunos':
            return 'Unix';
        case 'android':
            return 'Android';
        default:
            return 'none';
    }
};

export { getPlatform };
