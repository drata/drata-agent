import { pivotResultRows } from './query-result.helper';

// mimic a SQL pivot for query result json
describe('pivot result rows will flip rows and create json from columns', () => {
    it('takes query rows and columns and returns json object with associated key value pairs', () => {
        // query results in json format e.g. select name, data from ...
        const rows = [
            { name: 'name1', data: 'data-value-1' },
            { name: 'name2', data: 'data-value-2' },
            { name: 'name3', data: 'data-value-3' },
        ];

        expect(
            pivotResultRows({ rows, keyName: 'name', valueName: 'data' }),
        ).toEqual({
            name1: 'data-value-1',
            name2: 'data-value-2',
            name3: 'data-value-3',
        });
    });
    it('takes an empty array and returns empty json object {}', () => {
        expect(
            pivotResultRows({ rows: [], keyName: 'key', valueName: 'value' }),
        ).toEqual({});
    });
    it('takes undefind and returns undefined', () => {
        expect(
            pivotResultRows({
                rows: undefined as any,
                keyName: 'key',
                valueName: 'value',
            }),
        ).toEqual(undefined);
    });
});
