import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { cardBase } from '../../../renderer/helpers/style.helpers';

import { SyncState } from '../../../enums/sync-state.enum';
import { _t } from '../../../renderer/helpers/intl.helpers';
import { selectSyncState } from '../../../renderer/redux/selectors/data-store.selectors';

import { Theme } from '@drata/component-library';
import drataShieldLogoPath from '../../../assets/svg/drata-shield-logo.svg';

const Wrapper = styled.div<{ theme: Theme }>`
    ${cardBase}
    width: 100%;
    background-position: bottom right;
    background-repeat: no-repeat;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;

    & > p {
        font-size: 0.9rem;
        margin: 0 !important;
    }

    &:not(:last-child) {
        margin-bottom: 0.5rem;
    }
`;

const StyledH2 = styled.h2<{ theme: Theme }>`
    font-size: 1rem;
    color: ${({ theme }) => theme.baseColors.spaceCadet};
    margin-top: 2rem;
    font-size: 1.5rem;
    text-align: center;
`;

interface Props {
    allPassed: boolean;
    complianceChecksCount: number;
}

function MessageBanner({ allPassed, complianceChecksCount }: Props) {
    const syncState = useSelector(selectSyncState);

    if (!allPassed && complianceChecksCount > 0) {
        return null;
    }

    return (
        <Wrapper>
            <img
                src={drataShieldLogoPath}
                alt={_t({ id: 'Drata Shield Logo' })}
            />
            {allPassed && (
                <>
                    <StyledH2>
                        {_t({ id: 'Device compliance complete.' })}
                    </StyledH2>
                    <p>{_t({ id: 'No action needed at this time' })}</p>
                </>
            )}
            {complianceChecksCount === 0 && syncState === SyncState.RUNNING && (
                <>
                    <StyledH2>{_t({ id: 'Syncing your data!' })}</StyledH2>
                    <p>{_t({ id: 'Please wait' })}</p>
                </>
            )}
            {complianceChecksCount === 0 && syncState !== SyncState.RUNNING && (
                <>
                    <StyledH2>
                        {_t({ id: 'Waiting for the first Sync' })}
                    </StyledH2>
                    <p>
                        {_t({
                            id: 'Please click the "Sync now" button below',
                        })}
                    </p>
                </>
            )}
        </Wrapper>
    );
}

export { MessageBanner };
