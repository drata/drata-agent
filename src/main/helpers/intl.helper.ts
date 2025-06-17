import { createIntl, createIntlCache, IntlShape } from '@formatjs/intl';
import { FormatXMLElementFn, PrimitiveType } from 'intl-messageformat';
import type { MessageDescriptor } from 'react-intl';
import { DEFAULT_LOCALE, TRANSLATION_FILES } from '../../shared/intl.config';
import { Logger } from './logger.helpers';

export class IntlHelper {
    private static readonly logger = new Logger(
        IntlHelper.prototype.constructor.name,
    );

    private static readonly cache = createIntlCache();
    private static intl: IntlShape<string>;

    static setLocale(locale: string) {
        IntlHelper.intl = createIntl(
            {
                locale: locale,
                messages: TRANSLATION_FILES[locale],
                defaultLocale: DEFAULT_LOCALE,
            },
            IntlHelper.cache,
        );
    }

    static _t(
        { id, defaultMessage, description }: MessageDescriptor,
        values?:
            | Record<string, PrimitiveType | FormatXMLElementFn<string, string>>
            | undefined,
    ): string {
        if (!IntlHelper.intl) {
            IntlHelper.logger.warn(
                'Intl not initialized, initializing with default locale.',
            );
            IntlHelper.intl = createIntl(
                {
                    locale: DEFAULT_LOCALE,
                    messages: TRANSLATION_FILES[DEFAULT_LOCALE],
                    defaultLocale: DEFAULT_LOCALE,
                },
                IntlHelper.cache,
            );
        }
        return IntlHelper.intl.formatMessage(
            { id, defaultMessage, description },
            values,
        );
    }
}
