import { isNil } from 'lodash';
import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { Button } from '@drata/component-library';
import { MessageIcon } from './MessageIcon';

import { useBridge } from '../../../renderer/hooks/use-bridge.hook';
import { cardBase } from '../../../renderer/helpers/style.helpers';
import { rgba } from '../../../renderer/helpers/color.helpers';
import { _t } from '../../../renderer/helpers/intl.helpers';
import {
    addMessageAction,
    dismissCurrentAction,
} from '../../../renderer/redux/actions/messages.actions';
import { selectCurrentMessage } from '../../../renderer/redux/selectors/messages.selectors';

const Wrapper = styled.div`
    position: fixed;
    top: 4rem;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background-color: ${({ theme }) => rgba(theme.baseColors.dustyGray, 0.25)};
    z-index: 3;
`;

const Card = styled.div`
    ${cardBase}
    background-color: ${({ theme }) => rgba(theme.baseColors.white, 0.95)};
    width: 100%;
    height: 100%;
    padding: 3rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
`;

const Info = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const Title = styled.h2`
    font-size: 1.3rem;
    text-align: center;
    margin: 1rem 0 !important;
`;

const Description = styled.p`
    font-size: 0.9rem;
    text-align: center;
    margin: 0 !important;
`;

function MessageModal() {
    const dispatch = useDispatch();
    const bridge = useBridge();
    const dismissButton = useRef<HTMLButtonElement | null>(null);
    const message = useSelector(selectCurrentMessage);

    useEffect(() => {
        return bridge.onMessage('toast', m => {
            dispatch(addMessageAction(m));
        });
    }, [bridge, dispatch]);

    useEffect(() => {
        dismissButton.current?.focus();
    }, [dismissButton]);

    const closeMessage = () => dispatch(dismissCurrentAction());

    if (isNil(message)) {
        return null;
    }

    return (
        <Wrapper
            role="alertdialog"
            aria-labelledby="message-dialog-title"
            aria-describedby="message-dialog-description"
        >
            <Card role="document" tabIndex={0}>
                <Info>
                    <MessageIcon type={message.type} />
                    <Title id="message-dialog-title">
                        {_t(message.message)}
                    </Title>
                    {!isNil(message.secondaryMessage) && (
                        <Description id="message-dialog-description">
                            {_t(message.secondaryMessage)}
                        </Description>
                    )}
                </Info>
                <div>
                    {!isNil(message.navigationCta) ? (
                        <Button
                            color="primary"
                            ref={(node: HTMLButtonElement) => {
                                dismissButton.current = node;
                            }}
                            onClick={() => {
                                bridge.invoke(
                                    'openLink',
                                    message.navigationCta!.url,
                                );
                                closeMessage();
                            }}
                        >
                            {_t({ id: message.navigationCta!.title })}
                        </Button>
                    ) : (
                        <Button
                            color="primary"
                            ref={(node: HTMLButtonElement) => {
                                dismissButton.current = node;
                            }}
                            onClick={closeMessage}
                        >
                            {_t({ id: 'Okay' })}
                        </Button>
                    )}
                </div>
            </Card>
        </Wrapper>
    );
}

export { MessageModal };
