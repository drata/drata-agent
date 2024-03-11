import { app } from 'electron';
import { flatten } from 'lodash';
import path from 'path';
import { parseIntOrUndefined } from '../../helpers/string.helpers';
import { AgentDeviceIdentifiers } from '../api/types/agent-device-identifiers.type';
import { QueryResult } from './entities/query-result.type';
import { ISystemQueryService } from './entities/system-query.interface';
import { SystemQueryService } from './system-query.service';

export class UbuntuSystemQueryService
    extends SystemQueryService
    implements ISystemQueryService
{
    static readonly RESOURCES_PATH = 'lib/linux/bin/osqueryi';
    // only supporting suspend and hibernate b/c shutdown/logout can get frozen by dirty windows
    static readonly SUPPORTED_SUSPEND_TYPES: string[] = [
        'hibernate',
        'suspend',
    ];

    constructor() {
        super(
            app.isPackaged
                ? path.join(
                      process.resourcesPath,
                      UbuntuSystemQueryService.RESOURCES_PATH,
                  )
                : path.join(
                      __dirname,
                      '..',
                      UbuntuSystemQueryService.RESOURCES_PATH,
                  ),
        );
    }

    async getSystemInfo(): Promise<QueryResult> {
        const drataAgentVersion = app.getVersion();

        return {
            drataAgentVersion,
            platform: 'LINUX',
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
                    query: "SELECT COUNT(*) AS passed FROM augeas WHERE path = '/etc/ufw/ufw.conf' AND label = 'ENABLED' AND value = 'yes'",
                    transform: (res: any[]) => res[0],
                }),

                appList: await this.runQuery({
                    description:
                        'Return a list of ALL applications installed on the workstation',
                    query: 'SELECT name, version FROM deb_packages',
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
                    ],
                    flatten,
                ),

                macAddress: await this.runQuery({
                    description: 'What is the MAC Address of this machine?',
                    query: "SELECT mac FROM interface_details WHERE interface in (SELECT DISTINCT interface FROM interface_addresses WHERE interface NOT IN ('lo')) LIMIT 1",
                    transform: res => res[0],
                }),

                autoUpdateEnabled: await this.runQuery({
                    description: 'Is auto-update enabled on this machine?',
                    query: "SELECT COUNT(*) AS passed FROM file WHERE path = '/etc/apt/apt.conf.d/50unattended-upgrades'",
                    transform: (res: any[]) => res[0],
                }),

                screenLockStatus: await this.runQueries([
                    {
                        description: 'Time for screen to lock',
                        command:
                            'gsettings get org.gnome.desktop.screensaver lock-delay',
                    },
                    {
                        description: 'Is screenlock enabled?',
                        command:
                            'gsettings get org.gnome.desktop.screensaver lock-enabled',
                    },
                ]),

                adminUsers: await this.runQuery({
                    description: 'List of users with administrative privileges',
                    query: "SELECT u.username FROM users u JOIN user_groups ug ON ug.UID = u.UID JOIN groups g ON g.GID = ug.GID WHERE g.GROUPNAME = 'adm'",
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

                locationServices: await this.runQuery({
                    description: 'Are location services enabled?',
                    command: 'gsettings get org.gnome.system.location enabled',
                    transform: (res: any) => ({ commandsResults: res }),
                }),
                screenLockSettings: {
                    ...(await this.runQueries(
                        [
                            {
                                description: 'Power settings',
                                command:
                                    'gsettings list-recursively org.gnome.settings-daemon.plugins.power',
                            },
                            {
                                description: 'Screen saver settings',
                                command:
                                    'gsettings list-recursively org.gnome.desktop.screensaver',
                            },
                            {
                                description: 'Session settings',
                                command:
                                    'gsettings list-recursively org.gnome.desktop.session',
                            },
                        ],
                        res =>
                            this.processScreenSettings({
                                powerSettings: res?.[0],
                                screenSettings: res?.[1],
                                sessionSettings: res?.[2],
                            }),
                    )),
                },
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
                query: "SELECT mac FROM interface_details WHERE interface in (SELECT DISTINCT interface FROM interface_addresses WHERE interface NOT IN ('lo')) LIMIT 1",
                transform: res => res[0],
            }),
        };
    }

    private processScreenSettings({
        powerSettings,
        screenSettings,
        sessionSettings,
    }: {
        powerSettings: string | undefined;
        screenSettings: string | undefined;
        sessionSettings: string | undefined;
    }): any {
        try {
            const power = this.parseSettings(powerSettings) ?? {};
            const screen = this.parseSettings(screenSettings) ?? {};
            const session = this.parseSettings(sessionSettings) ?? {};

            return {
                screenLockEnabled: screen['lock-enabled'] === 'true',
                screenSaverIdleWait: parseIntOrUndefined(session['idle-delay']),
                lockDelay: parseIntOrUndefined(screen['lock-delay']),
                suspendScreenLockAC:
                    screen['ubuntu-lock-on-suspend'] === 'true' &&
                    UbuntuSystemQueryService.SUPPORTED_SUSPEND_TYPES.includes(
                        power['sleep-inactive-ac-type'],
                    ),
                suspendScreenLockDC:
                    screen['ubuntu-lock-on-suspend'] === 'true' &&
                    UbuntuSystemQueryService.SUPPORTED_SUSPEND_TYPES.includes(
                        power['sleep-inactive-battery-type'],
                    ),
                suspendIdleWaitAC: parseIntOrUndefined(
                    power['sleep-inactive-ac-timeout'],
                ),
                suspendIdleWaitDC: parseIntOrUndefined(
                    power['sleep-inactive-battery-timeout'],
                ),
            };
        } catch (error) {
            this.logger.error(error, 'Error processing settings.');
            return {};
        }
    }

    private parseSettings(settings: string | undefined): any {
        if (typeof settings !== 'string') return;
        return settings.split('\n').reduce((prev, cur) => {
            const item = cur.split(' ');
            return {
                ...prev,
                // 0 - schema, 1 - setting, value may have a type prefix we ignore
                [item[1]]: item[item.length - 1],
            };
        }, {});
    }
}
