import { MessagesState } from '../reducers/messages.reducer';

interface State {
    messages: MessagesState;
}

export const selectCurrentMessage = (state: State) => state.messages.current;
