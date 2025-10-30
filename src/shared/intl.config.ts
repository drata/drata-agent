import { MessageFormatElement } from 'react-intl';

// These are pretty small, so load them all for better experience
import de_DE from '../assets/data/locales/de-DE.json';
import en_US from '../assets/data/locales/en-US.json';
import es_LA from '../assets/data/locales/es-LA.json';
import fr_FR from '../assets/data/locales/fr-FR.json';
import it_IT from '../assets/data/locales/it-IT.json';

export type TranslationMessages = Record<string, MessageFormatElement[]>;

export const TRANSLATION_FILES: Record<string, TranslationMessages> = {
    'en-US': en_US,
    'de-DE': de_DE,
    'es-LA': es_LA,
    'fr-FR': fr_FR,
    'it-IT': it_IT,
} as const;

export const DEFAULT_LOCALE = 'en-US';

export type SupportedLocale = keyof typeof TRANSLATION_FILES;
