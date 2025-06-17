import { find, isNil } from 'lodash';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';

import { Button, buttonReset, Theme } from '@drata/component-library';
import { ArrowLeft, ExternalLink } from 'react-feather';

import { config } from '../../../config';
import { getComplianceCheckListItems } from '../../../constants/compliance';
import { _t } from '../../../renderer/helpers/intl.helpers';
import {
    cardBase,
    linkHighlight,
} from '../../../renderer/helpers/style.helpers';
import { useBridge } from '../../../renderer/hooks/use-bridge.hook';

const Wrapper = styled.main<{ theme: Theme }>`
    background-color: ${({ theme }) => theme.baseColors.cultured};
    padding: 0.5rem;
    display: flex;
    align-items: stretch;
`;

const Header = styled.div`
    display: flex;
    align-items: center;
`;

const BackButton = styled(Button)`
    ${buttonReset}
    margin-right: 0.5rem;
    padding: 0.5rem;
    border-radius: 2rem;
`;

const StyledH2 = styled.h2<{ theme: Theme }>`
    font-size: 1rem;
    color: ${({ theme }) => theme.baseColors.spaceCadet};
    margin-top: 0.2rem;
`;

const HelpInfo = styled.div<{ theme: Theme }>`
    ${cardBase}
    padding: 1rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 100%;
`;

const Instructions = styled.p`
    font-size: 0.75rem;
    line-height: 1.3rem;
    margin-top: 1.5rem;
`;

const HelpArticle = styled.span`
    display: flex;
    font-size: 0.75rem;
    line-height: 1.3rem;
    margin-top: 1.5rem;

    & > p {
        margin: 0 0.25rem 0 0 !important;
    }
`;

const HelpButton = styled(Button)<{ theme: Theme }>`
    ${buttonReset}
    color: ${({ theme }) => theme.baseColors.saphireBlue};

    ${linkHighlight}
`;

const GoToDrataButton = styled(Button)<{ theme: Theme }>`
    ${buttonReset}
    color: ${({ theme }) => theme.baseColors.saphireBlue};
    align-self: flex-end;
    font-size: 0.75rem;

    & svg {
        margin-left: 0.5rem;
        margin-bottom: 3px;
    }

    ${linkHighlight}
`;

function HelpPage() {
    const { complianceType } = useParams();
    const navigate = useNavigate();
    const bridge = useBridge();

    const info = find(getComplianceCheckListItems(), {
        type: complianceType,
    });

    if (isNil(info)) {
        return null;
    }

    return (
        <Wrapper>
            <HelpInfo>
                <div>
                    <Header>
                        <BackButton
                            color="flat-dark"
                            onClick={() => navigate(-1)}
                            aria-label={_t({ id: 'Navigate back' })}
                        >
                            <ArrowLeft />
                        </BackButton>
                        <StyledH2>{info.title}</StyledH2>
                    </Header>

                    <Instructions>{info.instructions}</Instructions>

                    <HelpArticle>
                        <p>
                            {_t({
                                id: 'Help article:',
                            })}
                        </p>
                        <HelpButton
                            onClick={() =>
                                bridge.invoke('openLink', info.helpLink.href)
                            }
                            color="link"
                        >
                            {info.helpLink.label}
                        </HelpButton>
                    </HelpArticle>
                </div>

                <GoToDrataButton
                    color="link"
                    onClick={() =>
                        bridge.invoke(
                            'openLink',
                            `${config.url.webApp}/employee`,
                        )
                    }
                >
                    {_t({ id: 'Go to My Drata' })}
                    <ExternalLink size={14} />
                </GoToDrataButton>
            </HelpInfo>
        </Wrapper>
    );
}

export { HelpPage };
