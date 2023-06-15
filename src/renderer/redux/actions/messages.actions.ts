import { createAction } from '@reduxjs/toolkit';
import { Message } from '../../../entities/message.interface';

export const addMessageAction = createAction(
    'ADD_MESSAGE',
    (message: Message) => {
        return { payload: message };
    },
);

export const dismissCurrentAction = createAction('DISMISS_CURRENT_MESSAGE');
