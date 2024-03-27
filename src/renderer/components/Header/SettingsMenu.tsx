import React, { useState } from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';

import {
    UncontrolledDropdown,
    DropdownMenu,
    DropdownToggle,
    DropdownItem,
    Modal,
    ModalHeader,
    Button,
} from 'reactstrap';
import { User, theme } from '@drata/component-library';
import {
    AtSign,
    ChevronDown,
    HelpCircle,
    Power,
    EyeOff,
    Settings,
    UserCheck,
    Activity,
    Minimize,
    ArrowUpCircle,
} from 'react-feather';

import { useBridge } from '../../../renderer/hooks/use-bridge.hook';
import {
    selectAppVersion,
    selectHasAccessToken,
    selectUser,
} from '../../../renderer/redux/selectors/data-store.selectors';
import { _t } from '../../../renderer/helpers/intl.helpers';
import { rgba } from '../../../renderer/helpers/color.helpers';
import { config } from '../../../config';
import { TargetEnv } from '../../../enums/target-env.enum';
import { LocalRegisterForm } from '../LandingPage/LocalRegisterForm';
import { MessageType } from '../../../entities/message-listener-type.enum';
import { Message } from '../../../entities/message.interface';
import { addMessageAction } from '../../../renderer/redux/actions/messages.actions';

import './setings-menu.scss';

const targetEnv = TargetEnv[process.env.TARGET_ENV as TargetEnv];
const ENV = targetEnv === TargetEnv.PROD ? '' : `[${targetEnv}] `;

// NOTE: overwrite vuexy list item line-height of .5
const StyledDropdownToggle = styled(DropdownToggle)`
    min-width: 3rem;
    height: 3rem;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 15rem;
    transition: background-color 300ms linear, color 300ms linear;
    cursor: pointer;
    color: ${({ theme }) => theme.baseColors.white};
    padding: 2px !important;
    border: 1px solid transparent;

    &:hover,
    &:focus {
        background-color: ${({ theme }) => rgba(theme.baseColors.white, 0.25)};
        color: ${({ theme }) => theme.baseColors.spaceCadet};
        outline: none !important;
        border: 1px solid ${({ theme }) => rgba(theme.baseColors.white, 0.5)};
    }
`;

const UserContainer = styled(User)`
    color: ${({ theme }) => theme.textColors.dark.medium};
    width: auto;

    & > div:first-child {
        display: none;
    }
`;

const StyledDropdownItem = styled(DropdownItem)`
    width: 100% !important;
`;

const StyledModalHeader = styled(ModalHeader)`
    .close {
        display: none;
    }
`;

function SettingsMenu() {
    const bridge = useBridge();
    const dispatch = useDispatch();
    const hasAccessToken = useSelector(selectHasAccessToken);
    const version = useSelector(selectAppVersion);
    const user = useSelector(selectUser);
    const [modal, setModal] = useState(false);
    const [extraMenu, setExtraMenu] = useState(false);

    const toggleModal: React.EventHandler<any> = () => {
        setModal(!modal);
    };

    const toggleExtraMenu: React.EventHandler<any> = evt => {
        setExtraMenu(evt.altKey ?? false);
    };

    const openModal = (m: Message) => {
        dispatch(addMessageAction(m));
    };

    return (
        <ul className="nav navbar-nav float-right">
            <UncontrolledDropdown
                onClick={e => {
                    toggleExtraMenu(e);
                }}
                tag="li"
                className="nav-item"
            >
                <StyledDropdownToggle
                    tag="a"
                    className="nav-link text-height-1"
                    tabIndex={0}
                >
                    {!hasAccessToken && (
                        <Settings size={20} color={theme.baseColors.white} />
                    )}
                    {!!user && (
                        <>
                            <UserContainer
                                direction="rtl"
                                avatarUrl={user.avatarUrl}
                                firstName={user.firstName}
                                lastName={user.lastName}
                            />
                            <ChevronDown
                                size={14}
                                className="ml-50"
                                color={theme.baseColors.white}
                            />
                        </>
                    )}
                </StyledDropdownToggle>
                <DropdownMenu right className="drt-header-user-dropdown">
                    <StyledDropdownItem disabled>
                        <span className="align-middle">
                            {ENV}
                            {_t({ id: 'Agent Version {version}' }, { version })}
                        </span>
                    </StyledDropdownItem>

                    <DropdownItem divider />

                    <StyledDropdownItem
                        onClick={() =>
                            bridge.invoke(
                                'openLink',
                                `${config.url.webApp}/employee`,
                            )
                        }
                    >
                        <UserCheck size={14} className="mr-50" />
                        <span>{_t({ id: 'My Drata' })}</span>
                    </StyledDropdownItem>

                    <StyledDropdownItem
                        onClick={() =>
                            openModal({
                                type: MessageType.ERROR,
                                message: {
                                    id: 'This will send recent diagnostics to Drata.',
                                },
                            })
                        }
                    >
                        <ArrowUpCircle size={14} className="mr-50" />
                        <span>{_t({ id: 'Send diagnostics' })}</span>
                    </StyledDropdownItem>

                    <StyledDropdownItem
                        onClick={() =>
                            bridge.invoke('openLink', config.url.help)
                        }
                    >
                        <HelpCircle size={14} className="mr-50" />
                        <span>{_t({ id: 'Help' })}</span>
                    </StyledDropdownItem>

                    {extraMenu && (
                        <>
                            <DropdownItem divider />
                            <StyledDropdownItem
                                onClick={() => bridge.invoke('hideApp')}
                            >
                                <EyeOff size={14} className="mr-50" />
                                <span>{_t({ id: 'Hide Agent' })}</span>
                            </StyledDropdownItem>
                        </>
                    )}

                    {extraMenu && (
                        <StyledDropdownItem
                            onClick={() => bridge.invoke('allowResize')}
                        >
                            <Minimize size={14} className="mr-50" />
                            <span>{_t({ id: 'Enable resize' })}</span>
                        </StyledDropdownItem>
                    )}

                    {extraMenu && (
                        <StyledDropdownItem
                            onClick={() => bridge.invoke('dumpDiagnostics')}
                        >
                            <Activity size={14} className="mr-50" />
                            <span>{_t({ id: 'Save diagnostics' })}</span>
                        </StyledDropdownItem>
                    )}

                    {extraMenu && !hasAccessToken && (
                        <StyledDropdownItem onClick={toggleModal}>
                            <AtSign size={14} className="mr-50" />
                            <span>{_t({ id: 'Register' })}</span>
                        </StyledDropdownItem>
                    )}

                    <DropdownItem divider />

                    <StyledDropdownItem
                        onClick={() => bridge.invoke('quitApp')}
                    >
                        <Power size={14} className="mr-50" />
                        <span>{_t({ id: 'Quit Agent' })}</span>
                    </StyledDropdownItem>
                </DropdownMenu>
            </UncontrolledDropdown>
            <Modal isOpen={modal} toggle={toggleModal}>
                <StyledModalHeader toggle={toggleModal}>
                    Register Agent
                </StyledModalHeader>
                <LocalRegisterForm />
                <Button onClick={toggleModal}>Cancel</Button>
            </Modal>
        </ul>
    );
}

export { SettingsMenu };
