import cp from 'child_process';
import { app } from 'electron';
import { filter, flatten } from 'lodash';
import path from 'path';
import { AgentDeviceIdentifiers } from '../api/types/agent-device-identifiers.type';
import { QueryResult } from './entities/query-result.type';
import { ISystemQueryService } from './entities/system-query.interface';
import { SystemQueryService } from './system-query.service';

export class WindowsSystemQueryService
    extends SystemQueryService
    implements ISystemQueryService
{
    static readonly RESOURCES_PATH = 'lib/windows/bin/osqueryi.exe';

    constructor() {
        // Osquery is not compatible with special characters in execution path, so use short name instead
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
                        'powercfg -attributes SUB_VIDEO VIDEOCONLOCK -ATTRIB_HIDE 2> NUL & powercfg /Q SCHEME_CURRENT SUB_VIDEO VIDEOCONLOCK 2> NUL && powercfg -attributes SUB_NONE CONSOLELOCK -ATTRIB_HIDE 2> NUL & powercfg /Q SCHEME_CURRENT SUB_NONE CONSOLELOCK 2> NUL',
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
                    transform: async (res: any[]) => parseInt(res[0]),
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
                query: 'SELECT mac FROM interface_details WHERE physical_adapter=1',
                transform: res => res[0],
            }),
        };
    }
}
