import React from 'react';
import styled from 'styled-components';

import { theme } from '@drata/component-library';

import { _t } from '../../../renderer/helpers/intl.helpers';

const Badge = styled.p`
    display: flex;
    align-items: center;
    margin: 0 !important;
`;

const Counter = styled.span`
    position: relative;
    width: 60px;
    height: 18px;
    display: inline-block;
    margin-right: 8px;

    & > div {
        display: flex;
        align-items: center;
    }
`;

const Value = styled.span<{
    pos: 'left' | 'right';
    color: typeof theme.statusColors.success | typeof theme.baseColors.white;
}>`
    position: absolute;
    left: ${({ pos }) => (pos === 'left' ? 0 : 'unset')};
    right: ${({ pos }) => (pos === 'right' ? 0 : 'unset')};
    top: 0;
    height: 18px;
    width: 33px;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2;
    font-size: inherit;
    color: ${({ color }) => color};
`;

const StyledSvg = styled.svg<{
    color:
        | typeof theme.statusColors.success
        | typeof theme.baseColors.dustyGray;
}>`
    position: absolute;
    left: 0;
    top: 0;
    color: ${({ color }) => color};
    z-index: 1;
`;

interface Props {
    total: number;
    passed: number;
}

function CounterBadge({ total, passed }: Props) {
    return (
        <Badge
            aria-label={_t(
                { id: '{passed} out of {total} tasks completed.' },
                { passed, total },
            )}
        >
            <Counter aria-hidden>
                <Value pos="left" color={theme.baseColors.white}>
                    {passed}
                </Value>
                <Value
                    pos="right"
                    color={
                        passed === 0
                            ? theme.baseColors.dustyGray
                            : theme.statusColors.success
                    }
                >
                    {total}
                </Value>
                <StyledSvg
                    width="60"
                    height="18"
                    viewBox="0 0 60 18"
                    fill="none"
                    color={
                        passed === 0
                            ? theme.baseColors.dustyGray
                            : theme.statusColors.success
                    }
                >
                    <path
                        d="M0 9C0 4.02944 4.02944 0 9 0H33.5L27.5 18H9C4.02944 18 0 13.9706 0 9Z"
                        fill="currentColor"
                    ></path>
                    <path
                        d="M58.75 9C58.75 13.5564 55.0563 17.25 50.5 17.25L27.0406 17.25L32.5406 0.750002L50.5 0.750003C55.0564 0.750003 58.75 4.44365 58.75 9Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                    ></path>
                </StyledSvg>
            </Counter>
            {_t({ id: 'Tasks completed' })}
        </Badge>
    );
}

export { CounterBadge };
