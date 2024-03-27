import cp from 'child_process';
import { app } from 'electron';
import { filter, flatten, isEmpty } from 'lodash';
import path from 'path';
import { parseIntOrUndefined } from '../../helpers/string.helpers';
import { AgentDeviceIdentifiers } from '../api/types/agent-device-identifiers.type';
import {
    REGISTRY_POWER_ROOT,
    WINDOWS_POWER_PERSONALITIES,
    WINDOWS_POWER_SETTINGS,
    getRegistryPowerSettingDefaultKey,
    getRegistryPowerSettingPolicyKey,
    getRegistryPowerSettingUserKey,
} from './constants/windows-power-settings';
import { QueryResult } from './entities/query-result.type';
import { ISystemQueryService } from './entities/system-query.interface';
import { WindowsPowerScheme } from './entities/windows-power-scheme-interface';
import { WindowsPowerSetting } from './entities/windows-power-setting-interface';
import { WindowsPowerSettingValue } from './entities/windows-power-setting-value-interface';
import { WindowsPowerSettingAlias } from './enums/windows-power-setting-alias';
import { pivotResultRows } from './helpers/query-result.helper';
import { SystemQueryService } from './system-query.service';

export class WindowsSystemQueryService
    extends SystemQueryService
    implements ISystemQueryService
{
    static readonly RESOURCES_PATH = 'lib/windows/bin/osqueryi.exe';

    constructor() {
        // Shell execution of osqueryi is not compatible with special characters in execution path, so use short name instead
        // https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file#short-vs-long-names
        const shortResourcePath: string = cp
            .execSync(`for %A in ("${process.resourcesPath}") do @echo %~sA`)
            .toString()
            .trim();

        super(
            app.isPackaged
                ? path.join(
                      shortResourcePath,
                      WindowsSystemQueryService.RESOURCES_PATH,
                  )
                : path.join(
                      __dirname,
                      '..',
                      WindowsSystemQueryService.RESOURCES_PATH,
                  ),
        );
    }

    async getSystemInfo(): Promise<QueryResult> {
        const drataAgentVersion = app.getVersion();

        return {
            drataAgentVersion,
            platform: 'WINDOWS',
            rawQueryResults: {
                osVersion: await this.runQuery({
                    description:
                        'Which Operating System (OS) and which version is running?',
                    query: 'SELECT name, version, platform FROM os_version',
                    transform: (res: any[]) => res[0],
                }),

                hwSerial: await this.runQuery({
                    description: "What's the workstations serial number?",
                    query: 'SELECT hardware_serial FROM system_info',
                    transform: (res: any[]) => res[0],
                }),

                hwModel: await this.runQuery({
                    description: "What's the workstations model?",
                    query: 'SELECT hardware_model FROM system_info',
                    transform: (res: any[]) => res[0],
                }),

                ...(await this.runQuery({
                    description: "What's the system information?",
                    query: 'SELECT board_serial, board_model, computer_name, hostname, local_hostname FROM system_info',
                    transform: (res: any[]) => ({
                        boardSerial: res[0]?.board_serial,
                        boardModel: res[0]?.board_model,
                        computerName: res[0]?.computer_name,
                        hostName: res[0]?.hostname,
                        localHostName: res[0]?.local_hostname,
                    }),
                })),

                firewallStatus: await this.runQuery({
                    description:
                        'Is the software firewall enabled on the workstation?',
                    query: 'SELECT firewall FROM windows_security_center',
                    transform: (res: any[]) => res[0],
                }),

                appList: await this.runQuery({
                    description:
                        'Return a list of ALL applications installed on the workstation',
                    query: 'SELECT name, version FROM programs',
                }),

                browserExtensions: await this.runQueries(
                    [
                        {
                            description: 'What are the Firefox extensions?',
                            query: 'SELECT name FROM firefox_addons',
                        },
                        {
                            description: 'What are the Chrome extensions?',
                            query: 'SELECT name FROM chrome_extensions',
                        },
                        {
                            description: 'What are the IE extensions?',
                            query: 'SELECT name FROM ie_extensions',
                        },
                    ],
                    flatten,
                ),

                macAddress: await this.runQuery({
                    description: 'What is the MAC Address of this machine?',
                    query: 'SELECT mac FROM interface_details WHERE physical_adapter=1',
                    transform: res => res[0],
                }),

                autoUpdateEnabled: await this.runQuery({
                    description: 'Is auto-update enabled on this machine?',
                    query: "SELECT IIF(autoupdate == 'Good', 1, 0) AS autoUpdateEnabled FROM windows_security_center",
                    transform: (res: { autoUpdateEnabled: string }[]) => {
                        const response = res[0];
                        return response.autoUpdateEnabled === '1';
                    },
                }),

                screenLockStatus: await this.runQuery({
                    description: 'Time for screen to lock',
                    command:
                        'powercfg /QH SCHEME_CURRENT SUB_VIDEO VIDEOCONLOCK 2> NUL && powercfg /QH SCHEME_CURRENT SUB_NONE CONSOLELOCK 2> NUL && powercfg /QH SCHEME_CURRENT SUB_SLEEP STANDBYIDLE 2> NUL',
                    transform: res => ({ commandResults: res }),
                }),

                adminUsers: await this.runQuery({
                    description: 'List of users with administrative privileges',
                    query: "SELECT u.username FROM users u JOIN user_groups ug ON ug.UID = u.UID JOIN groups g ON g.GID = ug.GID WHERE g.GROUPNAME = 'Administrators'",
                }),

                processor: await this.runQuery({
                    description: 'Processor Information',
                    query: 'SELECT cpu_type, cpu_brand FROM system_info',
                    transform: res => res[0],
                }),

                memory: await this.runQuery({
                    description: 'Physical Memory (RAM)',
                    query: 'SELECT physical_memory FROM system_info',
                    transform: res => res[0],
                }),

                hddSize: await this.runQuery({
                    description: 'Hard Disk Storage Capacity in GB',
                    query: 'SELECT round((disk_size * 10e-10), 2) AS hddSize FROM disk_info',
                    transform: res => res[0],
                }),

                graphics: await this.runQuery({
                    description: 'Physical Memory (RAM)',
                    query: 'SELECT manufacturer, model, series FROM video_info',
                    transform: res => res[0],
                }),

                winAvStatus: await this.runQuery({
                    description:
                        'Microsoft Defender Anti-Virus Security Center Status',
                    query: 'SELECT antivirus FROM windows_security_center LIMIT 1',
                    transform: res => res[0],
                }),

                winServicesList: await this.runQuery({
                    description: 'Curated list of Windows services',
                    query: 'SELECT name, description, status, start_type FROM services',
                    transform: res => {
                        try {
                            /**
                             * The list of services is filtered to get only those that can be useful
                             * At the moment we only require those from a list of AV services
                             */
                            const winAvServicesMatchList =
                                this.dataStore.get('winAvServicesMatchList') ??
                                [];

                            const lowerCaseWinAvServiceNames =
                                winAvServicesMatchList.map(serviceName =>
                                    serviceName.toLowerCase(),
                                );

                            return filter(res, service => {
                                return lowerCaseWinAvServiceNames.includes(
                                    service.name.toLowerCase(),
                                );
                            });
                        } catch (error) {
                            this.logger.error(
                                error,
                                'The following error happened on the method winServicesList()',
                            );
                            return [];
                        }
                    },
                }),

                hddEncryptionStatus: await this.runQuery({
                    description:
                        'Is the hard drive encryption enabled on the workstation?',
                    command:
                        "powershell -command (New-Object -ComObject Shell.Application).NameSpace((Get-ChildItem Env:SystemDrive).Value).Self.ExtendedProperty('System.Volume.BitLockerProtection')",
                    transform: async (res: any[]) =>
                        parseIntOrUndefined(res[0]),
                }),
                screenLockSettings: {
                    ...(await this.runQuery({
                        // https://learn.microsoft.com/en-us/windows/win32/api/ntsecapi/ne-ntsecapi-security_logon_type
                        // https://github.com/osquery/osquery/blob/5.10.2/osquery/tables/system/windows/logon_sessions.cpp
                        description:
                            'Screen saver enable with On resume, display logon screen and Wait: x minutes',
                        query: `WITH policy_setting(pname, pdata) AS (\
                                SELECT name, MAX(CAST(data AS INT)) AS data FROM logon_sessions\
                                LEFT JOIN registry r2 ON r2.key = 'HKEY_USERS\\' || logon_sid || '\\SOFTWARE\\Policies\\Microsoft\\Windows\\Control Panel\\Desktop'\
                                WHERE logon_type LIKE '%Interactive%' AND name IN ('ScreenSaveTimeOut', 'ScreenSaverIsSecure', 'ScreenSaveActive', 'DelayLockInterval')\
                                GROUP BY logon_sid, name\
                            ), user_setting(uname, udata) AS (\
                                SELECT name, MAX(CAST(data AS INT)) AS data FROM logon_sessions\
                                JOIN registry ON key = 'HKEY_USERS\\' || logon_sid || '\\Control Panel\\Desktop'\
                                WHERE logon_type LIKE '%Interactive%' AND name IN ('ScreenSaveTimeOut', 'ScreenSaverIsSecure', 'ScreenSaveActive', 'DelayLockInterval')\
                                GROUP BY logon_sid, name\
                            )\
                            SELECT COALESCE(pname, uname) AS name, COALESCE(pdata, udata) AS data FROM policy_setting\
                            FULL JOIN user_setting ON pname = uname`,
                        transform: (res: any[]) => {
                            try {
                                const result = pivotResultRows({
                                    rows: res,
                                    keyName: 'name',
                                    valueName: 'data',
                                });

                                return {
                                    screenLockEnabled:
                                        result.ScreenSaverIsSecure === '1' &&
                                        result.ScreenSaveActive === '1',
                                    screenSaverIdleWait: parseIntOrUndefined(
                                        result.ScreenSaveTimeOut,
                                    ),
                                    lockDelay: parseIntOrUndefined(
                                        result.DelayLockInterval,
                                    ),
                                };
                            } catch (error) {
                                this.logger.error(
                                    error,
                                    'Error retrieving screen saver settings.',
                                );
                                return {};
                            }
                        },
                    })),

                    ...(await this.getSuspendPowerSettings()),

                    machineInactivityLimit: await this.runQuery({
                        description: 'Machine inactivity limit policy',
                        query: "SELECT data FROM registry WHERE path = 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System\\InactivityTimeoutSecs'",
                        transform: res => parseIntOrUndefined(res[0]?.data),
                    }),
                }, // screenLockSettings
            },
        };
    }

    async getAgentDeviceIdentifiers(): Promise<AgentDeviceIdentifiers> {
        return {
            hwSerial: await this.runQuery({
                description: "What's the workstations serial number?",
                query: 'SELECT hardware_serial, board_serial FROM system_info',
                transform: (res: any[]) => res[0],
            }),
            macAddress: await this.runQuery({
                description: 'What is the MAC Address of this machine?',
                query: 'SELECT mac FROM interface_details WHERE physical_adapter=1',
                transform: res => res[0],
            }),
        };
    }

    private async getSuspendPowerSettings(): Promise<any> {
        try {
            const powerScheme = await this.getPowerScheme();
            if (
                !powerScheme?.activeScheme ||
                !powerScheme?.personalityAC ||
                !powerScheme?.personalityDC
            ) {
                this.logger.warn(
                    `Unable to retrieve power scheme ${JSON.stringify(
                        powerScheme,
                    )}.`,
                );
                return {};
            }

            const suspendScreenLock = await this.getPowerSettingValue({
                setting:
                    WINDOWS_POWER_SETTINGS[
                        WindowsPowerSettingAlias.CONSOLELOCK
                    ],
                scheme: powerScheme,
            });
            const suspendIdleWait = await this.getPowerSettingValue({
                setting:
                    WINDOWS_POWER_SETTINGS[
                        WindowsPowerSettingAlias.STANDBYIDLE
                    ],
                scheme: powerScheme,
            });

            return {
                suspendScreenLockAC: suspendScreenLock?.settingIndexAC
                    ? suspendScreenLock.settingIndexAC === 1
                    : undefined,
                suspendScreenLockDC: suspendScreenLock?.settingIndexDC
                    ? suspendScreenLock.settingIndexDC === 1
                    : undefined,
                suspendIdleWaitAC: suspendIdleWait?.settingIndexAC,
                suspendIdleWaitDC: suspendIdleWait?.settingIndexDC,
            };
        } catch (error) {
            this.logger.error(error, 'Error retrieving power plan settings.');
            return {};
        }
    }

    private async getPowerScheme(): Promise<WindowsPowerScheme | undefined> {
        const activeScheme = await this.runQuery({
            description: 'User active power scheme',
            query: `SELECT data FROM registry WHERE key = '${REGISTRY_POWER_ROOT}\\User\\PowerSchemes\\' AND name = 'ActivePowerScheme' LIMIT 1`,
            transform: res => res[0]?.data,
        });
        if (isEmpty(activeScheme)) return;

        const personality = await this.getPowerSettingValue({
            setting:
                WINDOWS_POWER_SETTINGS[
                    WindowsPowerSettingAlias.POWERSCHEME_PERSONALITY
                ],
            scheme: {
                activeScheme,
            },
        });

        return {
            activeScheme,
            personalityAC: personality?.settingIndexAC
                ? WINDOWS_POWER_PERSONALITIES[personality.settingIndexAC]
                : undefined,
            personalityDC: personality?.settingIndexDC
                ? WINDOWS_POWER_PERSONALITIES[personality.settingIndexDC]
                : undefined,
        };
    }

    private async getPowerSettingValue({
        setting,
        scheme,
    }: {
        setting: WindowsPowerSetting;
        scheme: WindowsPowerScheme;
    }): Promise<WindowsPowerSettingValue | undefined> {
        const result = await this.runQuery({
            description: 'User power setting',
            query: this.getPowerSettingQuery({
                setting: setting,
                scheme: scheme,
            }),
            transform: res =>
                pivotResultRows({
                    rows: res,
                    keyName: 'name',
                    valueName: 'data',
                }),
        });
        return {
            settingIndexAC: parseIntOrUndefined(result?.acsettingindex),
            settingIndexDC: parseIntOrUndefined(result?.dcsettingindex),
        };
    }

    private getPowerSettingQuery({
        setting,
        scheme,
    }: {
        setting: WindowsPowerSetting;
        scheme: WindowsPowerScheme;
    }): string | undefined {
        const userKey = getRegistryPowerSettingUserKey(
            setting,
            scheme.activeScheme,
        );
        if (setting.guid === WindowsPowerSettingAlias.POWERSCHEME_PERSONALITY) {
            return `SELECT data, LOWER(name) AS name FROM registry WHERE key = '${userKey}'`;
        }

        if (!scheme?.personalityAC || !scheme?.personalityDC) return;
        const policyKey = getRegistryPowerSettingPolicyKey(setting);
        const defaultKeyAC = getRegistryPowerSettingDefaultKey(
            setting,
            scheme.personalityAC,
        );
        const defaultKeyDC = getRegistryPowerSettingDefaultKey(
            setting,
            scheme.personalityDC,
        );
        /**
         * It is possible to have defaults split between AC and DC
         * CTE column names needed prefixed to prevent sqlite from consolidating rows
         * There is a typo in returned registry data names for defaults (AcSettingIndex) LOWER corrected
         * For osquery registry.key collate is nocase
         */
        return `WITH policy_setting(pdata, pname) AS (\
            SELECT data, name FROM registry WHERE key = '${policyKey}')\
            ,user_setting(udata, uname) AS (SELECT data, name FROM registry WHERE key = '${userKey}')\
            ,default_setting(ddata, dname) AS (\
            SELECT data, name FROM registry WHERE key = '${defaultKeyAC}' AND LOWER(name) = 'acsettingindex'\
            UNION SELECT data, name FROM registry WHERE key = '${defaultKeyDC}' AND LOWER(name) = 'dcsettingindex')\
            SELECT COALESCE(pdata, udata, ddata) AS data, LOWER(dname) as name\
            FROM default_setting LEFT JOIN user_setting ON LOWER(uname) = LOWER(dname) LEFT JOIN policy_setting ON LOWER(pname) = LOWER(dname)`;
    }
}
