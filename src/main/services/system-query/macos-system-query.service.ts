import { app } from 'electron';
import { flatten, isNil } from 'lodash';
import path from 'path';
import { AgentDeviceIdentifiers } from '../api/types/agent-device-identifiers.type';
import { QueryResult } from './entities/query-result.type';
import { ISystemQueryService } from './entities/system-query.interface';
import { SystemQueryService } from './system-query.service';

export class MacOsSystemQueryService
    extends SystemQueryService
    implements ISystemQueryService
{
    static readonly RESOURCES_PATH = 'lib/macos/bin/osqueryi';

    constructor() {
        super(
            app.isPackaged
                ? path.join(
                      process.resourcesPath,
                      MacOsSystemQueryService.RESOURCES_PATH,
                  )
                : path.join(
                      __dirname,
                      '..',
                      MacOsSystemQueryService.RESOURCES_PATH.replace(
                          '/bin',
                          `/bin/${process.arch}`,
                      ),
                  ),
        );
    }

    async getSystemInfo(): Promise<QueryResult> {
        const drataAgentVersion = app.getVersion();

        return {
            drataAgentVersion,
            platform: 'MACOS',
            rawQueryResults: {
                osVersion: await this.runQuery({
                    description:
                        "What Operating System is running and what is it's version?",
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

                hddEncryptionStatus: await this.runQuery({
                    description:
                        'Is the hard drive encryption enabled on the workstation?',
                    query: "SELECT de.encrypted FROM mounts m JOIN disk_encryption de on de.name=m.device WHERE m.path ='/'",
                    transform: (res: any[]) => res[0],
                }),

                fileVaultEnabled: await this.runQuery({
                    description: 'Is FileVault enabled on this Mac?',
                    command: 'fdesetup status',
                    transform: (res: any) => ({
                        commandResults: res,
                    }),
                }),

                firewallStatus: await this.runQuery({
                    description:
                        'Is the software firewall enabled on the workstation?',
                    query: 'SELECT global_state FROM alf',
                    transform: (res: any[]) => res[0],
                }),

                appList: await this.runQuery({
                    description:
                        'Return a list of ALL applications installed on the workstation',
                    query: 'SELECT name, bundle_short_version, info_string FROM apps',
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
                            description: 'What are the Safari extensions?',
                            query: 'SELECT name FROM safari_extensions',
                        },
                    ],
                    flatten,
                ),

                macAddress: await this.runQuery({
                    description: 'What is the MAC Address of this machine?',
                    query: "SELECT mac FROM interface_details WHERE interface in (SELECT DISTINCT interface FROM interface_addresses WHERE interface IN ('en0', 'en1')) LIMIT 1",
                    transform: res => res[0],
                }),

                autoUpdateEnabled: await this.runQuery({
                    description: 'Is auto-update enabled on this machine?',
                    query: "SELECT * FROM plist WHERE path = '/Library/Preferences/com.apple.SoftwareUpdate.plist' AND key = 'CriticalUpdateInstall' UNION SELECT * FROM plist WHERE path = '/Library/Preferences/com.apple.commerce.plist' AND key = 'AutoUpdate' UNION SELECT * FROM plist WHERE path = '/Library/Managed Preferences/com.apple.SoftwareUpdate.plist' AND key = 'CriticalUpdateInstall' UNION SELECT * FROM plist WHERE path = '/Library/Managed Preferences/com.apple.commerce.plist' AND key = 'AutoUpdate'",
                }),

                gateKeeperEnabled: await this.runQuery({
                    description: 'Is Gatekeeper enabled on this Mac?',
                    query: 'SELECT assessments_enabled FROM gatekeeper',
                    transform: res => res[0],
                }),

                screenLockStatus: await this.runQueries(
                    [
                        {
                            description: 'Time for screen to lock',
                            query: "SELECT value FROM preferences WHERE domain='com.apple.screensaver' AND key='idleTime' UNION ALL SELECT value FROM managed_policies WHERE domain='com.apple.screensaver' AND name='idleTime'",
                        },
                        {
                            description: 'Is screenlock enabled?',
                            query: 'SELECT enabled, grace_period FROM screenlock',
                        },
                    ],
                    this.screenLockStatusTransform,
                ),

                adminUsers: await this.runQuery({
                    description: 'List of users with administrative privileges',
                    query: 'SELECT users.uid, users.username FROM user_groups INNER JOIN users ON user_groups.uid = users.uid WHERE user_groups.gid = 80',
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
                    query: "SELECT round((blocks * blocks_size * 10e-10), 2) AS hddSize FROM mounts WHERE path='/'",
                    transform: res => res[0],
                }),
            },
        };
    }

    /**
     * Takes care of picking the worst case scenario
     * between the system preferences and the managed policies (e.g.: kandji)
     * for
     */
    private screenLockStatusTransform(
        res: [
            Array<{ value: string } | undefined>,
            [{ enabled: string; grace_period: string }],
        ],
    ): [{ value: string } | null, { enabled: string; grace_period: string }] {
        const screenSaverTimeItems = res[0];

        let maxScreenSaverTimeItem = screenSaverTimeItems[0] ?? null;

        if (!isNil(maxScreenSaverTimeItem)) {
            let maxValue = Number(maxScreenSaverTimeItem.value);

            for (let i = 1; i < screenSaverTimeItems.length; i++) {
                const item = screenSaverTimeItems[i];
                if (!isNil(item)) {
                    const value = Number(item.value);
                    if (value > maxValue) {
                        maxValue = value;
                        maxScreenSaverTimeItem = item;
                    }
                }
            }
        }

        return [maxScreenSaverTimeItem, res[1][0]];
    }

    async getAgentDeviceIdentifiers(): Promise<AgentDeviceIdentifiers> {
        return {
            hwSerial: await this.runQuery({
                description: "What's the workstations serial number?",
                query: 'SELECT hardware_serial FROM system_info',
                transform: (res: any[]) => res[0],
            }),
            macAddress: await this.runQuery({
                description: 'What is the MAC Address of this machine?',
                query: "SELECT mac FROM interface_details WHERE interface in (SELECT DISTINCT interface FROM interface_addresses WHERE interface IN ('en0', 'en1')) LIMIT 1",
                transform: res => res[0],
            }),
        };
    }
}
