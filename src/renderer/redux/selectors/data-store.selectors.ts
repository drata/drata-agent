import { RendererDataStore } from '../../../types/renderer-data-store';

interface State {
    dataStore: RendererDataStore;
}

export const selectDataStore = (state: State) => state.dataStore;

export const selectHasAccessToken = (state: State) =>
    state.dataStore.hasAccessToken;

export const selectAppVersion = (state: State) => state.dataStore.appVersion;

export const selectUser = (state: State) => state.dataStore.user;

export const selectSyncState = (state: State) => state.dataStore.syncState;

export const selectLastCheckedAt = (state: State) =>
    state.dataStore.lastCheckedAt;

export const selectComplianceChecks = (state: State) =>
    state.dataStore.complianceData?.complianceChecks ?? [];
