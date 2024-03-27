import { WindowsPowerSetting } from '../entities/windows-power-setting-interface';
import { WindowsPowerSchemeDefault } from '../enums/windows-power-scheme-default';
import { WindowsPowerSettingAlias } from '../enums/windows-power-setting-alias';
import { WindowsPowerSubgroupAlias } from '../enums/windows-power-subgroup-alias';

export const REGISTRY_POWER_ROOT =
    'HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\Power';

export const REGISTRY_POWER_POLICY_ROOT =
    'HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Microsoft\\Power\\PowerSettings';

export const getRegistryPowerSettingUserKey = (
    setting: WindowsPowerSetting,
    schemeGuid: string,
) =>
    `${REGISTRY_POWER_ROOT}\\User\\PowerSchemes\\${schemeGuid}\\${
        setting.subGroupGuid === WindowsPowerSubgroupAlias.SUB_NONE
            ? ''
            : `${setting.subGroupGuid}\\`
    }${setting.guid}`;

export const getRegistryPowerSettingDefaultKey = (
    setting: WindowsPowerSetting,
    scheme: WindowsPowerSchemeDefault,
) =>
    `${REGISTRY_POWER_ROOT}\\PowerSettings\\${
        setting.subGroupGuid === WindowsPowerSubgroupAlias.SUB_NONE
            ? ''
            : `${setting.subGroupGuid}\\`
    }${setting.guid}\\DefaultPowerSchemeValues\\${scheme}`;

export const getRegistryPowerSettingPolicyKey = (
    setting: WindowsPowerSetting,
) => `${REGISTRY_POWER_POLICY_ROOT}\\${setting.guid}`;

export const WINDOWS_POWER_PERSONALITIES = [
    WindowsPowerSchemeDefault.MAX_POWER_SAVINGS, // 0 - Power Saver
    WindowsPowerSchemeDefault.MIN_POWER_SAVINGS, // 1 - High Performance
    WindowsPowerSchemeDefault.TYPICAL_POWER_SAVINGS, // 2 - Balanced
] as const;

export const WINDOWS_POWER_SETTINGS: Readonly<
    Record<WindowsPowerSettingAlias, Readonly<WindowsPowerSetting>>
> = {
    [WindowsPowerSettingAlias.STANDBYIDLE]: {
        description: 'Sleep idle timeout',
        subGroupGuid: WindowsPowerSubgroupAlias.SUB_SLEEP,
        guid: WindowsPowerSettingAlias.STANDBYIDLE,
    },
    [WindowsPowerSettingAlias.CONSOLELOCK]: {
        description: 'Prompt for password on resume',
        subGroupGuid: WindowsPowerSubgroupAlias.SUB_NONE,
        guid: WindowsPowerSettingAlias.CONSOLELOCK,
    },
    [WindowsPowerSettingAlias.POWERSCHEME_PERSONALITY]: {
        description: 'Power plan type',
        subGroupGuid: WindowsPowerSubgroupAlias.SUB_NONE,
        guid: WindowsPowerSettingAlias.POWERSCHEME_PERSONALITY,
    },
};
