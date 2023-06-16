import React from 'react';
import ReactDOM from 'react-dom';
import { ThemeProvider } from 'styled-components';
import { Provider } from 'react-redux';

import { theme } from '@drata/component-library';
import { App } from './components/App';

import store from './redux/store';
import { IntlProvider } from './utility/IntlProvider';
import { StateConnector } from './helpers/state-connector';

import '@drata/component-library/dist/index.css';
import '@openfonts/montserrat_all';
import './index.css';

StateConnector.init(store);

ReactDOM.render(
    <Provider store={store}>
        <IntlProvider>
            <ThemeProvider theme={theme}>
                <App />
            </ThemeProvider>
        </IntlProvider>
    </Provider>,
    document.getElementById('root'),
);
