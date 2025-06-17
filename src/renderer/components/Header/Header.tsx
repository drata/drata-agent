import React from 'react';
import styled from 'styled-components';

import { DrataIconLight, Theme } from '@drata/component-library';
import { HeaderBadge } from './HeaderBadge';
import { SettingsMenu } from './SettingsMenu';

import { _t } from '../../../renderer/helpers/intl.helpers';

const StyledHeader = styled.header<{ theme: Theme }>`
    background-color: ${({ theme }) => theme.baseColors.spaceCadet};
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
`;

const StyledH1 = styled.h1`
    margin: 0;

    & > span {
        display: flex;
        align-items: center;
    }
`;

const StyledDrataLogo = styled(DrataIconLight)`
    height: 15px;
    width: 83px;
`;

const StyledHeaderBadge = styled(HeaderBadge)`
    margin-left: 0.5rem;
`;

function Header() {
    return (
        <StyledHeader>
            <StyledH1 aria-label={_t({ id: 'Drata Agent' })}>
                <span aria-hidden>
                    <StyledHeaderBadge />
                </span>
            </StyledH1>

            <SettingsMenu />
        </StyledHeader>
    );
}

export { Header };
