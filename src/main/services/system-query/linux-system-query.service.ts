import { app } from 'electron';
import { flatten } from 'lodash';
import path from 'path';
import { AgentDeviceIdentifiers } from '../api/types/agent-device-identifiers.type';
import { QueryResult } from './entities/query-result.type';
import { ISystemQueryService } from './entities/system-query.interface';
import { SystemQueryService } from './system-query.service';

export class LinuxSystemQueryService
    extends SystemQueryService
    implements ISystemQueryService
{
    static readonly RESOURCES_PATH = 'lib/linux/bin/osqueryi';

    constructor() {
        super(
            app.isPackaged
                ? path.join(
                      process.resourcesPath,
                      LinuxSystemQueryService.RESOURCES_PATH,
                  )
                : path.join(
                      __dirname,
                      '..',
                      LinuxSystemQueryService.RESOURCES_PATH,
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
            },
        };
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
                query: "SELECT mac FROM interface_details WHERE interface in (SELECT DISTINCT interface FROM interface_addresses WHERE interface NOT IN ('lo')) LIMIT 1",
                transform: res => res[0],
            }),
        };
    }
}
