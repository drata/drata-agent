import { createAction } from '@reduxjs/toolkit';
import { RendererDataStore } from '../../../types/renderer-data-store';

export const setDataStoreAction = createAction(
    'SET_DATA_STORE',
    (dataStore?: RendererDataStore) => {
        return { payload: dataStore };
    },
);
