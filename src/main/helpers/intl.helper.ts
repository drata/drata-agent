import { createIntl, createIntlCache, IntlShape } from '@formatjs/intl';
import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import { LOCALES } from '../../constants/paths';
import { Logger } from './logger.helpers';

export class IntlHelper {
    private static readonly logger = new Logger(
        IntlHelper.prototype.constructor.name,
    );

    private static intl: IntlShape<string>;
    private static messages: Record<string, string>;

    static init() {
        if (!app.isReady()) {
            throw new Error(
                `${IntlHelper.prototype.constructor.name} needs to be initialized after app is ready.`,
            );
        }

        const locale = app.getLocale();

        const messagesFilePath = path.join(
            LOCALES,
            `${locale.substr(0, 2)}.json`,
        );

        const defaultMessagesFilePath = path.join(LOCALES, 'en.json');

        let json: string;

        try {
            json = fs.readFileSync(messagesFilePath, 'utf8');
        } catch (error) {
            this.logger.warn(
                `Unable to load intl data for locale "${locale.substr(
                    0,
                    2,
                )}". Loading english intl data as default.`,
            );
            json = fs.readFileSync(defaultMessagesFilePath, 'utf8');
        }

        this.messages = JSON.parse(json) ?? {};

        this.intl = createIntl(
            {
                locale: locale,
                messages: this.messages,
            },
            createIntlCache(),
        );
    }

    static translate(
        { id }: { id: string },
        values?: Record<string, string>,
    ): string {
        return this.intl.formatMessage({ id }, values);
    }
}
