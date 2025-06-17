import { isEmpty, isFunction, isNil } from 'lodash';
import { ProcessHelper } from '../../helpers/process.helpers';
import { AgentDeviceIdentifiers } from '../api/types/agent-device-identifiers.type';
import { ServiceBase } from '../service-base.service';
import { QueryResult } from './entities/query-result.type';
import { Query } from './entities/query.type';

export abstract class SystemQueryService extends ServiceBase {
    abstract getSystemInfo(): Promise<QueryResult>;

    abstract getAgentDeviceIdentifiers(): Promise<AgentDeviceIdentifiers>;

    constructor(protected osqueryiBinaryPath: string) {
        super();
    }

    async getDebugInfo(): Promise<unknown> {
        return {
            osquery: await this.runQuery({
                description: 'What version of osquery are we using?',
                query: 'SELECT version from osquery_info',
                transform: (res: unknown[]) => res[0],
            }),
            os: await this.runQuery({
                description: 'What operating system and version are we using?',
                query: 'SELECT version, build, platform FROM os_version',
                transform: (res: unknown[]) => res[0],
            }),
            system_info: await this.getAgentDeviceIdentifiers(),
            email: this.dataStore?.get('user')?.email,
            region: this.dataStore?.get('region'),
        };
    }

    protected async raceSequentialQueries<T>(
        queries: Array<Query>,
        transform: (res: any) => T = (res: T) => res,
    ): Promise<T | undefined> {
        for (const query of queries) {
            const result = await this.runQuery(query);
            if (!isEmpty(result)) {
                return transform(result);
            }
        }

        return transform([]);
    }

    protected async runQueries<T>(
        queries?: Array<Query | undefined>,
        transform: (res: any) => T = (res: T) => res,
    ): Promise<T | undefined> {
        let results: any;

        try {
            if (isNil(queries)) {
                return transform([]);
            }

            results = await Promise.all(
                queries.map(query => this.runQuery(query)),
            );

            return transform(results);
        } catch (error) {
            this.logger.error(error, {
                message: `The queries "${queries
                    ?.map(query => query?.description)
                    .join(', ')} failed to run"`,
                rawResult: results,
            });

            return {} as T;
        }
    }

    protected async runQuery(query?: Query): Promise<any | undefined> {
        let result: any;

        try {
            if (isNil(query)) {
                return;
            }

            if (typeof query.query !== 'undefined') {
                const raw = await ProcessHelper.runQuery(
                    this.osqueryiBinaryPath,
                    `--json "${query.query}"`,
                );
                result = JSON.parse(raw);
            } else if (typeof query.command !== 'undefined') {
                result = await ProcessHelper.runCommand(query.command);
            } else {
                throw new Error(
                    `The query "${query.description}" doesn't include neither a query nor a command.`,
                );
            }

            if (isFunction(query.transform)) {
                return query.transform(result);
            }

            return result;
        } catch (error) {
            this.logger.error(error, {
                message: `The query "${query?.description}" failed to run "${
                    query?.command ??
                    query?.query ??
                    'ERROR: missing command and query'
                }`,
                rawResult: result,
            });

            return {};
        }
    }
}
