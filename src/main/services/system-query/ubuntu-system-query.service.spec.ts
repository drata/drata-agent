/**
 * Adding unit tests to parse method only for documentation, until full tests created for getSystemInfo
 * TODO: Remove private method tests
 */
import { UbuntuSystemQueryService } from './ubuntu-system-query.service';

jest.mock('./system-query.service', () => ({
    SystemQueryService: jest.fn().mockImplementation(function (this: any) {
        this.logger = { error: jest.fn() };
    }),
}));

jest.mock('electron', () => ({
    app: {
        isPackaged: jest.fn().mockReturnValue(false),
        getPath: jest.fn().mockReturnValue('.'),
        getVersion: jest.fn().mockReturnValue('0.0.0'),
    },
}));

// gsettings list-recursively org.gnome.settings-daemon.plugins.power
const GSETTINGS_GNOME_POWER_PLUGIN_SCHEMA = `org.gnome.settings-daemon.plugins.power ambient-enabled true
org.gnome.settings-daemon.plugins.power idle-brightness 30
org.gnome.settings-daemon.plugins.power idle-dim true
org.gnome.settings-daemon.plugins.power lid-close-ac-action 'suspend'
org.gnome.settings-daemon.plugins.power lid-close-battery-action 'suspend'
org.gnome.settings-daemon.plugins.power lid-close-suspend-with-external-monitor false
org.gnome.settings-daemon.plugins.power power-button-action 'interactive'
org.gnome.settings-daemon.plugins.power power-saver-profile-on-low-battery true
org.gnome.settings-daemon.plugins.power sleep-inactive-ac-timeout 3600
org.gnome.settings-daemon.plugins.power sleep-inactive-ac-type 'nothing'
org.gnome.settings-daemon.plugins.power sleep-inactive-battery-timeout 1200
org.gnome.settings-daemon.plugins.power sleep-inactive-battery-type 'suspend'`;

// gsettings list-recursively org.gnome.desktop.screensaver
const GSETTINGS_GNOME_DESKTOP_SCREENSAVER_SCHEMA = `org.gnome.desktop.screensaver color-shading-type 'solid'
org.gnome.desktop.screensaver embedded-keyboard-command ''
org.gnome.desktop.screensaver embedded-keyboard-enabled false
org.gnome.desktop.screensaver idle-activation-enabled true
org.gnome.desktop.screensaver lock-delay uint32 30
org.gnome.desktop.screensaver lock-enabled true
org.gnome.desktop.screensaver logout-command ''
org.gnome.desktop.screensaver logout-delay uint32 7200
org.gnome.desktop.screensaver logout-enabled false
org.gnome.desktop.screensaver picture-opacity 100
org.gnome.desktop.screensaver picture-options 'zoom'
org.gnome.desktop.screensaver picture-uri 'file:///usr/share/backgrounds/warty-final-ubuntu.png'
org.gnome.desktop.screensaver primary-color '#023c88'
org.gnome.desktop.screensaver secondary-color '#5789ca'
org.gnome.desktop.screensaver show-full-name-in-top-bar true
org.gnome.desktop.screensaver status-message-enabled true
org.gnome.desktop.screensaver ubuntu-lock-on-suspend true
org.gnome.desktop.screensaver user-switch-enabled true`;

// gsettings list-recursively org.gnome.desktop.session
const GSETTINGS_GNOME_DESKTOP_SESSION_SCHEMA = `org.gnome.desktop.session idle-delay uint32 900
org.gnome.desktop.session session-name 'ubuntu'`;

describe('gsettings parser', () => {
    it('can convert to object power settings', () => {
        const serviceUnderTest = new UbuntuSystemQueryService();
        const results = serviceUnderTest['parseSettings'](
            GSETTINGS_GNOME_POWER_PLUGIN_SCHEMA,
        );

        expect(results['sleep-inactive-ac-timeout']).toBe('3600');
        expect(results['sleep-inactive-battery-timeout']).toBe('1200');
    });

    it('can convert to object screen settings with combination of uint32 prefix and boolean', () => {
        const serviceUnderTest = new UbuntuSystemQueryService();
        const results = serviceUnderTest['parseSettings'](
            GSETTINGS_GNOME_DESKTOP_SCREENSAVER_SCHEMA,
        );

        expect(results['ubuntu-lock-on-suspend']).toBeTruthy();
        expect(results['lock-delay']).toBe('30');
        expect(results['lock-enabled']).toBeTruthy();
    });

    it('can convert to object desktop session settings with uint32 prefix', () => {
        const serviceUnderTest = new UbuntuSystemQueryService();
        const results = serviceUnderTest['parseSettings'](
            GSETTINGS_GNOME_DESKTOP_SESSION_SCHEMA,
        );

        expect(results['idle-delay']).toBe('900');
    });
});
