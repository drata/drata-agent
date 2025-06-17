import { isString } from 'lodash';
import React, { JSX, ReactNode } from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
    padding: 1rem 0.5rem 1rem 0;
    display: flex;
    font-size: 11px;
    text-align: left;
`;

const IconColumn = styled.div`
    width: 3rem;
    display: flex;
    justify-content: center;
`;

const InfoColumn = styled.div`
    display: flex;
    flex-direction: column;
`;

const H2 = styled.h2`
    font-size: 1.2rem;
    text-align: left;
    margin-bottom: 0.5rem !important;
`;

interface Props {
    title: string;
    icon: JSX.Element;
    subheader?: ReactNode;
}

function ComplianceInfoHeader({ title, icon, subheader }: Props) {
    return (
        <Wrapper>
            <IconColumn>{icon}</IconColumn>
            <InfoColumn>
                <H2>{title}</H2>
                {isString(subheader) ? (
                    <p className="m-0">{subheader}</p>
                ) : (
                    subheader
                )}
            </InfoColumn>
        </Wrapper>
    );
}

export { ComplianceInfoHeader };
