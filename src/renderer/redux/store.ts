import { applyMiddleware, createStore } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import thunk from 'redux-thunk';
import { rootReducer } from './reducers';

export default createStore(
    rootReducer,
    composeWithDevTools(applyMiddleware(thunk)),
);
