import { combineReducers } from 'redux';
import { dataStore } from './data-store.reducer';
import { messages } from './messages.reducer';

export const rootReducer = combineReducers({ dataStore, messages });
