import { Platform } from '../../../enums/platform.enum';
import { getPlatform } from '../../helpers/platform.helpers';
import { LinuxSystemQueryService } from './linux-system-query.service';
import { MacOsSystemQueryService } from './macos-system-query.service';
import { SystemQueryService } from './system-query.service';
import { WindowsSystemQueryService } from './windows-system-query.service';

export class SystemQueryFactory {
    static getService(): SystemQueryService {
        const platform = getPlatform();

        switch (platform) {
            case Platform.MACOS:
                return new MacOsSystemQueryService();
            case Platform.WINDOWS:
                return new WindowsSystemQueryService();
            case Platform.LINUX:
                return new LinuxSystemQueryService();
            default:
                throw new Error(`Unhandled platform "${platform}"`);
        }
    }
}
