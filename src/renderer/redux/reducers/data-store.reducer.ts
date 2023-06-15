import { createReducer } from '@reduxjs/toolkit';
import { RendererDataStore } from '../../../types/renderer-data-store';
import { setDataStoreAction } from '../actions/data-store.actions';

const initialState: RendererDataStore = {
    hasAccessToken: false,
};

export const dataStore = createReducer(initialState, builder => {
    builder.addCase(setDataStoreAction, (state, action) => {
        return action.payload;
    });
});
