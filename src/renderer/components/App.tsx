import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { HashRouter as Router, Route } from 'react-router-dom';

import { Header } from './Header/Header';
import { ComplianceInfo } from './ComplianceInfo/ComplianceInfo';
import { LandingPage } from './LandingPage/LandingPage';
import { HelpPage } from './HelpPage/HelpPage';
import { Footer } from './Footer/Footer';
import { MessageModal } from './MessageModal/MessageModal';

import { useBridge } from '../hooks/use-bridge.hook';
import { setDataStoreAction } from '../../renderer/redux/actions/data-store.actions';
import {
    selectAppVersion,
    selectHasAccessToken,
    selectUser,
} from '../../renderer/redux/selectors/data-store.selectors';
import { AppRoute } from './app-route.enum';

import { RumInitConfiguration, datadogRum } from '@datadog/browser-rum';
import { config } from '../../config';
import { isEmpty } from 'lodash';

const AppWrapper = styled.div<{ isAuthenticated: boolean }>`
    height: 100%;
    display: grid;
    grid-template-rows: ${({ isAuthenticated }) =>
        isAuthenticated ? '4rem 1fr 3.375rem' : '4rem 1fr'};
`;

const App = () => {
    const MAX_ERRORS = 10;
    const dispatch = useDispatch();
    const bridge = useBridge();
    const hasAccessToken = useSelector(selectHasAccessToken);
    const [isAppReady, setIsAppReady] = useState(
        Boolean(window.sessionStorage.getItem('APP_READY')),
    );
    const version = useSelector(selectAppVersion);
    const user = useSelector(selectUser);
    const [errors, setErrors] = React.useState<any[]>([]);

    const onError = () => {
        try {
            if (!isEmpty(errors)) {
                // we only want logs errors when interaction occurs
                datadogRum.startView('error');
                // log all known errors for message and clear
                errors.forEach((e: any) => {
                    // prepare for prettier error reporting
                    const err = new Error(e.message);
                    err.stack = e.stack;
                    datadogRum.addError(err, { context: e.context });
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            if (!isEmpty(errors)) {
                setErrors([]);
            }
        }
    };

    useEffect(() => {
        return bridge.onMessage('appReady', () => {
            if (!isAppReady) {
                window.sessionStorage.setItem('APP_READY', String(true));
                setIsAppReady(true);
            }
        });
    }, [bridge, isAppReady]);

    useEffect(() => {
        return bridge.onMessage('addError', err => {
            try {
                if (!isEmpty(err)) {
                    setErrors(state => {
                        if (state.length >= MAX_ERRORS) {
                            state.shift();
                        }
                        return [...state, err];
                    });
                }
            } catch (e) {
                console.error(e);
            }
        });
    }, [bridge]);

    useEffect(() => {
        let isInitialized = !isEmpty(datadogRum.getInitConfiguration());
        if (isAppReady && version && !isInitialized) {
            datadogRum.init({
                ...config.datadog,
                version,
            } as RumInitConfiguration);

            isInitialized = true;
        }

        if (
            user?.email &&
            user?.entryId &&
            isInitialized &&
            isEmpty(datadogRum.getUser())
        ) {
            // set user if available, will reload on registration
            datadogRum.setUser({
                id: user.entryId,
                email: user.email,
            });
        }
    }, [user?.email, user?.entryId, isAppReady, version]);

    useEffect(() => {
        if (isAppReady) {
            bridge
                .invoke('getDataStore')
                .then(data => dispatch(setDataStoreAction(data)))
                .catch(error => {
                    console.error(error);
                });
        }
    }, [bridge, dispatch, isAppReady]);

    return (
        <AppWrapper isAuthenticated={hasAccessToken}>
            <Router>
                <Header />

                <Route
                    path={AppRoute.HOME}
                    component={hasAccessToken ? ComplianceInfo : LandingPage}
                    exact
                />

                <Route path={AppRoute.HELP} component={HelpPage} exact />

                {hasAccessToken && <Footer />}
            </Router>

            <MessageModal onError={onError} />
        </AppWrapper>
    );
};

export { App };
