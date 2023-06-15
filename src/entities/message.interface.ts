import { _t } from '../renderer/helpers/intl.helpers';
import { MessageType } from './message-listener-type.enum';

export interface Message {
    type: MessageType;
    message: Parameters<typeof _t>[0];
    values?: Parameters<typeof _t>[1];
    secondaryMessage?: Parameters<typeof _t>[0];
    secondaryValues?: Parameters<typeof _t>[1];
    navigationCta?: {
        title: string;
        url: string;
    };
}
