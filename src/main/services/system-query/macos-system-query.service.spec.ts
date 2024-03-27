/**
 * Adding unit tests to parse method only for documentation, until full tests created for getSystemInfo
 * TODO: Remove private method tests
 */
import { MacOsSystemQueryService } from './macos-system-query.service';

jest.mock('./system-query.service', () => ({
    SystemQueryService: jest.fn().mockImplementation(function (this: any) {
        this.logger = { error: jest.fn() };
    }),
}));

jest.mock('electron', () => ({
    app: {
        isPackaged: jest.fn().mockReturnValue(false),
        getPath: jest.fn().mockReturnValue(''),
        getVersion: jest.fn().mockReturnValue('0.0.0'),
    },
}));

const PMSET_CUSTOM_OUTPUT = `Battery Power:
 Sleep On Power Button 1
 lowpowermode         0
 standby              1
 ttyskeepawake        1
 hibernatemode        3
 powernap             1
 hibernatefile        /var/vm/sleepimage
 displaysleep         20
 womp                 0
 networkoversleep     0
 sleep                1
 lessbright           1
 tcpkeepalive         1
 disksleep            10
AC Power:
 Sleep On Power Button 1
 lowpowermode         0
 standby              1
 ttyskeepawake        1
 hibernatemode        3
 powernap             1
 hibernatefile        /var/vm/sleepimage
 displaysleep         30
 womp                 1
 networkoversleep     0
 sleep                1
 tcpkeepalive         1
 disksleep            10`;

const PMSET_CUSTOM_OUTPUT_REVERSED = `AC Power:
 Sleep On Power Button 1
 lowpowermode         0
 standby              1
 ttyskeepawake        1
 hibernatemode        3
 powernap             1
 hibernatefile        /var/vm/sleepimage
 displaysleep         30
 womp                 1
 networkoversleep     0
 sleep                1
 tcpkeepalive         1
 disksleep            10
Battery Power:
 Sleep On Power Button 1
 lowpowermode         0
 standby              1
 ttyskeepawake        1
 hibernatemode        3
 powernap             1
 hibernatefile        /var/vm/sleepimage
 displaysleep         20
 womp                 0
 networkoversleep     0
 sleep                1
 lessbright           1
 tcpkeepalive         1
 disksleep            10`;

describe('output parser for pmset -g custom', () => {
    /**
     * See man pmset for details
     * Output example for supported MacOS versions `pmset -g custom`
     *
     * Example output sets
     * AC (adapter) displaysleep = 30
     * DC (Battery) displaysleep = 20
     **/
    it('returns setting key value pair for displaysleep both values when dc settings come first', () => {
        const serviceUnderTest = new MacOsSystemQueryService();
        expect(serviceUnderTest['parseSettings'](PMSET_CUSTOM_OUTPUT)).toEqual({
            displayIdleWaitAC: 30,
            displayIdleWaitDC: 20,
        });
    });

    it('returns setting key value pair for displaysleep both values when ac settings come first', () => {
        const serviceUnderTest = new MacOsSystemQueryService();
        expect(
            serviceUnderTest['parseSettings'](PMSET_CUSTOM_OUTPUT_REVERSED),
        ).toEqual({ displayIdleWaitAC: 30, displayIdleWaitDC: 20 });
    });

    // max value for display sleep is 8,589,934,592
    it('supports 10 place values for displaysleep setting', () => {
        const serviceUnderTest = new MacOsSystemQueryService();
        const settingsWithLongSleep = PMSET_CUSTOM_OUTPUT.replace(
            'displaysleep         20',
            'displaysleep         1234567890',
        );
        expect(
            serviceUnderTest['parseSettings'](settingsWithLongSleep),
        ).toEqual({
            displayIdleWaitAC: 30,
            displayIdleWaitDC: 1234567890,
        });
    });

    it('will return negative values for displaysleep setting', () => {
        const serviceUnderTest = new MacOsSystemQueryService();
        const settingsWithNegativeSleep = PMSET_CUSTOM_OUTPUT.replace(
            'displaysleep         20',
            'displaysleep         -1234',
        );
        expect(
            serviceUnderTest['parseSettings'](settingsWithNegativeSleep),
        ).toEqual({
            displayIdleWaitAC: 30,
            displayIdleWaitDC: -1234,
        });
    });
});
