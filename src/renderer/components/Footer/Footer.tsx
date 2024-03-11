import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
import { isNil } from 'lodash';

import {
    Button,
    getLocalFormatedDatetime,
    theme,
} from '@drata/component-library';
import { RefreshCw } from 'react-feather';

import { useBridge } from '../../../renderer/hooks/use-bridge.hook';
import {
    selectSyncState,
    selectLastCheckedAt,
} from '../../../renderer/redux/selectors/data-store.selectors';
import { _t } from '../../../renderer/helpers/intl.helpers';
import { SyncState } from '../../../enums/sync-state.enum';

const SUCCESS_MESSAGE_DURATION = 4000; // 4 seconds

const StyledFotter = styled.footer<{
    color: typeof theme.statusColors.danger | typeof theme.baseColors.dustyGray;
}>`
    border-top: 1px solid #dae1e7;
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    color: ${({ color }) => color};
`;

const StyledButton = styled(Button)`
    height: 30px;
    flex-shrink: 0;
    padding: 0 0.75rem;
    color: inherit;

    &:hover,
    &:focus {
        color: ${({ theme }) => theme.baseColors.black};
    }
`;

const TimeStamp = styled.p`
    font-size: 0.75rem;
    margin: 0 0 0 0.75rem;
    color: inherit;
`;

const StyledRefreshCw = styled(RefreshCw)`
    &.spinning {
        animation: 1s linear 0s infinite spin;
    }

    @keyframes spin {
        100% {
            transform: rotateZ(360deg);
        }
    }
`;

function Footer() {
    const bridge = useBridge();
    const lastCheckedAt = useSelector(selectLastCheckedAt);
    const syncState = useSelector(selectSyncState);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    useEffect(() => {
        buttonRef.current?.focus();
    }, [buttonRef]);

    useEffect(() => {
        let timeoutId: any;

        if (syncState === SyncState.SUCCESS) {
            setShowSuccessMessage(true);
            timeoutId = setTimeout(() => {
                setShowSuccessMessage(false);
            }, SUCCESS_MESSAGE_DURATION);
        }

        return () => {
            if (!isNil(timeoutId)) {
                clearTimeout(timeoutId);
            }
        };
    }, [syncState]);

    return (
        <StyledFotter
            color={
                syncState === SyncState.ERROR
                    ? theme.statusColors.danger
                    : theme.baseColors.doveGray
            }
        >
            <StyledButton
                onClick={() => bridge.invoke('runSync')}
                ref={buttonRef}
                disabled={syncState === SyncState.RUNNING}
                outline
            >
                <StyledRefreshCw
                    size={14}
                    className={classnames('mr-1', {
                        spinning: syncState === SyncState.RUNNING,
                    })}
                />
                {_t({ id: 'Sync now' })}
            </StyledButton>
            <TimeStamp>
                {showSuccessMessage
                    ? `${_t({ id: 'Sync Successful' })}!`
                    : _t(
                          { id: 'Last synced: {syncedAt}' },
                          {
                              syncedAt:
                                  getLocalFormatedDatetime(lastCheckedAt) ||
                                  '-',
                          },
                      )}
            </TimeStamp>
        </StyledFotter>
    );
}

export { Footer };
