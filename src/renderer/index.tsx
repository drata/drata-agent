import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'styled-components';

import { theme } from '@drata/component-library';
import { App } from './components/App';

import { StateConnector } from './helpers/state-connector';
import store from './redux/store';
import { IntlProvider } from './utility/IntlProvider';

import '@drata/component-library/dist/index.css';
import './index.css';

StateConnector.init(store);

const root = createRoot(document.getElementById('root')!);
root.render(
    <Provider store={store}>
        <IntlProvider>
            <ThemeProvider theme={theme}>
                <App />
            </ThemeProvider>
        </IntlProvider>
    </Provider>,
);
