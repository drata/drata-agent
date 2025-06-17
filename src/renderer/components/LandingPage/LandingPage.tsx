import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

import { Button, Theme } from '@drata/component-library';
import { Mail, Monitor } from 'react-feather';

import { config } from '../../../config';
import { _t } from '../../../renderer/helpers/intl.helpers';
import { useBridge } from '../../../renderer/hooks/use-bridge.hook';

const LandingPageWrapper = styled.main`
    overflow-y: auto;
    background-position: bottom right;
    background-repeat: no-repeat;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
    gap: 2rem;
`;

const StyledH2 = styled.h2<{ theme: Theme }>`
    font-size: 1.4rem;
    line-height: 1.5;
    color: ${({ theme }) => theme.baseColors.spaceCadet};
    margin-bottom: 1rem;
`;

const StyledH3 = styled.h3<{ theme: Theme }>`
    font-size: 0.9rem;
    color: ${({ theme }) => theme.baseColors.spaceCadet};
    margin-bottom: 0.5rem;
`;

const StyledParagraph = styled.h3<{ width: number; theme: Theme }>`
    font-size: 0.7rem;
    line-height: 1.5;
    font-weight: 300;
    color: ${({ theme }) => theme.baseColors.spaceCadet};
    max-width: ${({ width }) => `${width}px`};
    margin: 0;
`;

const StepContainer = styled.div`
    display: flex;
    gap: 1rem;
    align-items: flex-start;

    & > div {
        flex: 1;
    }
`;

const IconContainer = styled.span<{ theme: Theme }>`
    flex: 0 0 1.5rem;
    height: 1.5rem;
    border: 1px solid ${({ theme }) => theme.baseColors.spaceCadet};
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 0.25rem;
`;

const StayledMail = styled(Mail)<{ theme: Theme }>`
    color: ${({ theme }) => theme.baseColors.spaceCadet};
`;

function LandingPage() {
    const bridge = useBridge();
    const ctaButtonRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        ctaButtonRef.current?.focus();
    }, []);

    return (
        <LandingPageWrapper>
            <StyledH2>
                {_t({
                    id: 'Way to go! The Drata Agent has been installed.',
                })}
            </StyledH2>

            <StepContainer>
                <IconContainer>
                    <StayledMail size={10} />
                </IconContainer>
                <div>
                    <StyledH3>
                        {_t({
                            id: 'Check your Email',
                        })}
                    </StyledH3>
                    <StyledParagraph width={230}>
                        {_t({
                            id: "If you've already received an email, please follow the instructions to register the agent.",
                        })}
                    </StyledParagraph>
                </div>
            </StepContainer>

            <StepContainer>
                <IconContainer>
                    <Monitor size={10} />
                </IconContainer>
                <div>
                    <StyledH3>
                        {_t({
                            id: 'Register your Workstation',
                        })}
                    </StyledH3>
                    <StyledParagraph width={200}>
                        {_t({
                            id: 'Otherwise, go to the "Install the Drata Agent" section of your My Drata page, and click on the "Register Drata Agent" button.',
                        })}
                    </StyledParagraph>
                </div>
            </StepContainer>

            <Button
                color="primary"
                onClick={() =>
                    bridge.invoke('openLink', `${config.url.webApp}/employee`)
                }
                ref={ctaButtonRef}
            >
                {_t({
                    id: 'Go to My Drata',
                })}
            </Button>
        </LandingPageWrapper>
    );
}

export { LandingPage };
