import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import { IntlProvider as ReactIntlProvider } from 'react-intl';
import {
    DEFAULT_LOCALE,
    TRANSLATION_FILES,
    TranslationMessages,
} from '../../shared/intl.config';
import { useBridge } from '../hooks/use-bridge.hook';

type ContextValueType = {
    state: {
        locale: string;
        messages: TranslationMessages;
    };
    switchLanguage: (language: string) => void;
};

const Context = React.createContext<ContextValueType | null>(null);

interface Props {
    readonly children: ReactNode;
}

function IntlProvider({ children }: Props) {
    const bridge = useBridge();
    const [locale, setLocale] = useState(DEFAULT_LOCALE);
    const [messages, setMessages] = useState<TranslationMessages>(
        TRANSLATION_FILES[DEFAULT_LOCALE],
    );

    useEffect(() => {
        bridge.invoke('getDataStore').then((data: { locale?: string }) => {
            setLocale(data.locale ?? DEFAULT_LOCALE);
            setMessages(TRANSLATION_FILES[data.locale ?? DEFAULT_LOCALE]);
        });

        // Listen for data store updates
        return bridge.onMessage(
            'dataStoreUpdate',
            (data: { locale?: string }) => {
                if (data.locale && data.locale !== locale) {
                    setLocale(data.locale);
                    setMessages(TRANSLATION_FILES[data.locale]);
                }
            },
        );
    }, [bridge, locale]);

    const contextValue = useMemo(
        () => ({
            state: { locale, messages },
            switchLanguage: (language: string) => {
                setLocale(language);
                setMessages(TRANSLATION_FILES[language]);
                bridge.invoke('changeLanguage', language);
            },
        }),
        [locale, messages, bridge],
    );

    return (
        <Context.Provider value={contextValue}>
            <ReactIntlProvider
                locale={locale}
                messages={messages}
                defaultLocale={DEFAULT_LOCALE}
            >
                {children}
            </ReactIntlProvider>
        </Context.Provider>
    );
}

export { Context as IntlContext, IntlProvider };
