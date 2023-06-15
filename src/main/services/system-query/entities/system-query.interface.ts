import { QueryResult } from './query-result.type';

export interface ISystemQueryService {
    getSystemInfo(): Promise<QueryResult>;
}
