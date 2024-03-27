import { WindowsPowerSettingAlias } from 'main/services/system-query/enums/windows-power-setting-alias';
import { WindowsPowerSubgroupAlias } from 'main/services/system-query/enums/windows-power-subgroup-alias';

export interface WindowsPowerSetting {
    description: string;
    guid: WindowsPowerSettingAlias;
    subGroupGuid: WindowsPowerSubgroupAlias;
}
