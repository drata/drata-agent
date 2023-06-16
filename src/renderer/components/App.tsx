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
import { selectHasAccessToken } from '../../renderer/redux/selectors/data-store.selectors';
import { AppRoute } from './app-route.enum';

const AppWrapper = styled.div<{ isAuthenticated: boolean }>`
    height: 100%;
    display: grid;
    grid-template-rows: ${({ isAuthenticated }) =>
        isAuthenticated ? '4rem 1fr 3.375rem' : '4rem 1fr'};
`;

const App = () => {
    const dispatch = useDispatch();
    const bridge = useBridge();
    const hasAccessToken = useSelector(selectHasAccessToken);
    const [isAppReady, setIsAppReady] = useState(
        Boolean(window.sessionStorage.getItem('APP_READY')),
    );

    useEffect(() => {
        return bridge.onMessage('appReady', () => {
            if (!isAppReady) {
                window.sessionStorage.setItem('APP_READY', String(true));
                setIsAppReady(true);
            }
        });
    }, [bridge, isAppReady]);

    useEffect(() => {
        if (isAppReady) {
            bridge
                .invoke('getDataStore')
                .then(data => dispatch(setDataStoreAction(data)))
                .catch(error => {
                    /**
                     * #####       ####
                     *   #    ###  #   #  ###
                     *   #   #   # #   # #   #
                     *   #   #   # #   # #   #
                     *   #    ###  ####   ###
                     *
                     * ToDo: display a safe error once we have a component for that
                     */

                    // It's ok to have this console.error here since the users don't have access to the console
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

            <MessageModal />
        </AppWrapper>
    );
};

export { App };
