import { WindowsPowerSchemeDefault } from '../enums/windows-power-scheme-default';

export interface WindowsPowerScheme {
    activeScheme: string;
    personalityAC?: WindowsPowerSchemeDefault;
    personalityDC?: WindowsPowerSchemeDefault;
}
