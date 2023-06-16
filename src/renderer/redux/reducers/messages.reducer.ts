import { createReducer } from '@reduxjs/toolkit';
import { Message } from '../../../entities/message.interface';
import {
    addMessageAction,
    dismissCurrentAction,
} from '../actions/messages.actions';

export type MessagesState = { list: Message[]; current?: Message };

const initialState: MessagesState = {
    list: [],
};

export const messages = createReducer(initialState, builder => {
    builder.addCase(addMessageAction, (state, action) => {
        state.list.push(action.payload);
        state.current = action.payload;
    });
    builder.addCase(dismissCurrentAction, state => {
        state.current = undefined;
    });
});
