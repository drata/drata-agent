import React from 'react';
import { MessageType } from '../../../entities/message-listener-type.enum';
import { Message } from '../../../entities/message.interface';

import { theme } from '@drata/component-library';
import { Info, AlertOctagon, AlertTriangle, CheckCircle } from 'react-feather';

interface Props {
    type: Message['type'];
}

function MessageIcon({ type }: Props) {
    if (type === MessageType.INFO) {
        return <Info size={36} color={theme.statusColors.info} />;
    }

    if (type === MessageType.SUCCESS) {
        return <CheckCircle size={36} color={theme.statusColors.success} />;
    }

    if (type === MessageType.WARNING) {
        return <AlertTriangle size={36} color={theme.statusColors.warning} />;
    }

    if (type === MessageType.ERROR) {
        return <AlertOctagon size={36} color={theme.statusColors.danger} />;
    }

    return null;
}

export { MessageIcon };
