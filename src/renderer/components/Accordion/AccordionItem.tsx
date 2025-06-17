import React, { ReactElement, ReactNode } from 'react';
import styled from 'styled-components';

import { Button, buttonReset, Theme } from '@drata/component-library';
import { isNil } from 'lodash';
import { ChevronDown, ChevronUp } from 'react-feather';
import { Collapse } from 'reactstrap';

const HeaderButton = styled(Button)<{ $highlighting: boolean; theme: Theme }>`
    ${buttonReset}
    width: 100%;
    border-radius: 0;

    & > span {
        width: 100%;
    }

    &:hover,
    &:focus {
        color: inherit;
        background-color: ${({ theme, $highlighting }) =>
            $highlighting ? theme.baseColors.concrete : 'transparent'};
        outline-style: none;
        box-shadow: none;
    }
`;

const HeaderContent = styled.div`
    display: grid;
    grid-template-columns: 1fr 3rem;
`;

const OpenIndicator = styled.div`
    height: 3rem;
    display: flex;
    justify-content: center;
    align-items: center;
`;

interface Props {
    header: ReactElement | string;
    children: ReactNode;
    id: string;
    isOpen?: boolean;
    onClick?: () => void;
}

function AccordionItem({ header, children, isOpen = false, onClick }: Props) {
    return (
        <>
            <HeaderButton
                color="link"
                onClick={onClick}
                $highlighting={!isNil(onClick)}
            >
                <HeaderContent>
                    {header}
                    {!isNil(onClick) && (
                        <OpenIndicator>
                            {isOpen ? <ChevronUp /> : <ChevronDown />}
                        </OpenIndicator>
                    )}
                </HeaderContent>
            </HeaderButton>
            <Collapse isOpen={isOpen}>{children}</Collapse>
        </>
    );
}

export { AccordionItem };
