import { parseIntOrUndefined, truncateString } from './string.helpers';

describe('string helper truncateString', () => {
    it('returns truncated at length with ellipsis', () => {
        expect(truncateString('123456789', 5)).toEqual('12345 ...');
        expect(truncateString('123456789', 7)).toEqual('1234567 ...');
        expect(truncateString('123456789', 1)).toEqual('1 ...');
    });
    it('returns value if shorter than length', () => {
        expect(truncateString('123456789', 500)).toEqual('123456789');
        expect(truncateString('test', 50)).toEqual('test');
        expect(truncateString('1234', 5)).toEqual('1234');
        expect(truncateString('123456789', -1)).toEqual('123456789');
        expect(truncateString('123456789', -10)).toEqual('123456789');
    });
    it('returns value when length <=0', () => {
        expect(truncateString('123456789', 0)).toEqual('123456789');
    });
});

describe('string helper parseIntOrUndefined', () => {
    it('returns undefined for NaN', () => {
        expect(parseIntOrUndefined('b1cad30')).toBeUndefined();
        expect(parseIntOrUndefined('Bad Number')).toBeUndefined();
        expect(parseIntOrUndefined('')).toBeUndefined();
        expect(parseIntOrUndefined(null)).toBeUndefined();
        expect(parseIntOrUndefined({ a: 1, b: 2 })).toBeUndefined();
        expect(parseIntOrUndefined({ c: '153' })).toBeUndefined();
        expect(parseIntOrUndefined(undefined)).toBeUndefined();
        expect(parseIntOrUndefined(Infinity as any)).toBeUndefined();
    });
    it('returns integer with finite numbers', () => {
        expect(parseIntOrUndefined(0)).toEqual(0);
        expect(parseIntOrUndefined(1000)).toEqual(1000);
        expect(parseIntOrUndefined(-1)).toEqual(-1);
        expect(parseIntOrUndefined(-99)).toEqual(-99);
        expect(parseIntOrUndefined('1234')).toEqual(1234);
        expect(parseIntOrUndefined('0')).toEqual(0);
        expect(parseIntOrUndefined('-183802')).toEqual(-183802);
        expect(parseIntOrUndefined('-10')).toEqual(-10);
        expect(parseIntOrUndefined('1a30')).toEqual(1);
    });
});
