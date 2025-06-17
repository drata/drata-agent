import { find, isNil } from 'lodash';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { Button, buttonReset, Theme } from '@drata/component-library';
import { ChevronRight } from 'react-feather';
import { ComplianceListItemIcon } from './ComplianceListItemIcon';

import { getComplianceCheckListItems } from '../../../constants/compliance';
import { ComplianceCheckResponseDto } from '../../../main/services/api/dtos/compliance-check-response.dto';
import { reverse } from '../../../renderer/helpers/route.helpers';
import { AppRoute } from '../app-route.enum';

const StledButton = styled(Button)<{ theme: Theme }>`
    ${buttonReset}
    padding: 1rem 0.65rem 1rem 0;
    border-top: 1px solid ${({ theme }) => theme.baseColors.alto};
    font-size: 0.75rem;
    width: 100%;
    border-radius: 0;

    & > span {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;

        & > div {
            display: flex;
            align-items: center;
        }
    }

    &:hover,
    &:focus {
        color: inherit;
        background-color: ${({ theme }) => theme.baseColors.concrete};
        outline-style: none;
        box-shadow: none;
    }
`;

const IconColumn = styled.div`
    width: 3rem;
    display: flex;
    justify-content: center;
`;

interface Props {
    complianceCheck: ComplianceCheckResponseDto;
}

function ComplianceListItem({ complianceCheck }: Props) {
    const navigate = useNavigate();

    const info = find(getComplianceCheckListItems(), {
        type: complianceCheck.type,
    });

    if (isNil(info)) {
        return null;
    }

    return (
        <StledButton
            color="default"
            onClick={(evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
                evt.stopPropagation();
                navigate(
                    reverse(AppRoute.HELP, {
                        complianceType: complianceCheck.type,
                    }),
                );
            }}
        >
            <div>
                <IconColumn>
                    <ComplianceListItemIcon
                        isCompliant={complianceCheck.compliant}
                    />
                </IconColumn>
                {info.title}
            </div>
            <ChevronRight size={16} />
        </StledButton>
    );
}

export { ComplianceListItem };
