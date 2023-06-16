import React, { ReactNode, useState } from 'react';
import { createIntl, createIntlCache, RawIntlProvider } from 'react-intl';

import messagesEn from '../../assets/data/locales/en.json';

const TRANSLATION_FILES: Record<string, Record<string, string>> = {
    en: messagesEn as Record<string, string>,
};

type ContextValueType = {
    state: {
        locale: string,
        messages: Record<string, string>,
    },
    switchLanguage: (language: string) => void,
}

const Context = React.createContext<ContextValueType | null>(null);
const cache = createIntlCache();

const defaultLocale = 'en';

let intl = createIntl(
    {
        locale: defaultLocale,
        messages: TRANSLATION_FILES[defaultLocale],
        defaultLocale: defaultLocale,
    },
    cache,
);

interface Props {
    children: ReactNode,
}

function IntlProvider({ children }: Props) {
    const [locale, setLocale] = useState(defaultLocale);
    const [messages, setMessages] = useState(TRANSLATION_FILES[defaultLocale]);

    return (
        <Context.Provider
            value={{
                state: { locale, messages },
                switchLanguage: (language) => {
                    setLocale(language);
                    setMessages(TRANSLATION_FILES[language]);
                    intl = createIntl({
                        locale: language,
                        messages: TRANSLATION_FILES[language],
                        defaultLocale: language,
                    });
                },
            }}
        >
            <RawIntlProvider value={intl}>{children}</RawIntlProvider>
        </Context.Provider>
    );
}

export { IntlProvider, Context as IntlContext, intl };
