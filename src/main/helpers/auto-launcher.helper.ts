import AutoLaunch from 'auto-launch';
import { app } from 'electron';
import { PLATFORM } from '../../constants/environment';
import { PathHelper } from './path.helpers';

export class AutoLauncherHelper {
    /**
     * Enable auto launch on system boot.
     * To correct possible errors on this config the setting gets disabled and re-enabled at every run.
     */
    static async enable(): Promise<void> {
        const options: { name: string; path?: string } = {
            name: 'Drata',
        };

        if (PLATFORM.LINUX) {
            // fix problematic space on the executable path on .desktop file
            options.path = PathHelper.safeSpaces(app.getPath('exe'));
        }

        const autoLauncher = new AutoLaunch(options);
        const isEnabled = await autoLauncher.isEnabled();

        if (isEnabled && !PLATFORM.MACOS) {
            await autoLauncher.disable();
            await autoLauncher.enable();
        } else {
            await autoLauncher.enable();
        }
    }
}
