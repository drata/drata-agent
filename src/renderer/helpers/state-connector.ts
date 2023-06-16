import { Store } from 'redux';
import { setDataStoreAction } from '../../renderer/redux/actions/data-store.actions';

export class StateConnector {
    static init(store: Store) {
        window.bridge.onMessage('dataStoreUpdate', data => {
            store.dispatch(setDataStoreAction(data));
        });
    }
}
