import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';

import { Theme, User, theme } from '@drata/component-library';
import {
    AtSign,
    ChevronDown,
    Download,
    Globe,
    HelpCircle,
    Loader,
    Power,
    Settings,
    UserCheck,
} from 'react-feather';
import {
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    Modal,
    ModalHeader,
} from 'reactstrap';

import { config } from '../../../config';
import { MessageType } from '../../../entities/message-listener-type.enum';
import { TargetEnv } from '../../../enums/target-env.enum';
import { rgba } from '../../../renderer/helpers/color.helpers';
import { _t } from '../../../renderer/helpers/intl.helpers';
import { useBridge } from '../../../renderer/hooks/use-bridge.hook';
import { addMessageAction } from '../../../renderer/redux/actions/messages.actions';
import {
    selectAppVersion,
    selectHasAccessToken,
    selectUser,
} from '../../../renderer/redux/selectors/data-store.selectors';
import { LanguageForm } from '../LandingPage/LanguageForm';
import { LocalRegisterForm } from '../LandingPage/LocalRegisterForm';

import './setings-menu.scss';

const targetEnv = TargetEnv[process.env.TARGET_ENV as TargetEnv];
const ENV = targetEnv === TargetEnv.PROD ? '' : `[${targetEnv}] `;

const StyledDropdownToggle = styled(DropdownToggle)<{ theme: Theme }>`
    min-width: 3rem;
    height: 3rem;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 15rem;
    transition:
        background-color 300ms linear,
        color 300ms linear;
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

const UserContainer = styled(User)<{ theme: Theme }>`
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

const SpinningLoader = styled(Loader)`
    animation: spin 1s linear infinite;

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
`;

type ModalType = 'register' | 'language' | null;

function SettingsMenu() {
    const bridge = useBridge();
    const dispatch = useDispatch();
    const hasAccessToken = useSelector(selectHasAccessToken);
    const version = useSelector(selectAppVersion);
    const user = useSelector(selectUser);
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [isDownloadingLogs, setIsDownloadingLogs] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const openRegisterModal: React.EventHandler<any> = () => {
        setActiveModal('register');
    };

    const openLanguageModal: React.EventHandler<any> = () => {
        setActiveModal('language');
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const closeModal = () => {
        setActiveModal(null);
    };

    const clearRegistration = async () => {
        try {
            await bridge.invoke('clearRegistration');
        } catch (error) {
            dispatch(
                addMessageAction({
                    type: MessageType.ERROR,
                    message: { id: 'Failed to clear registration' },
                    secondaryMessage: {
                        id: 'Please try again or contact support if the problem persists.',
                    },
                }),
            );
        }
    };

    const handleDownloadLogs = async () => {
        setIsDownloadingLogs(true);
        try {
            await bridge.invoke('downloadLog');
        } catch (error) {
            dispatch(
                addMessageAction({
                    type: MessageType.ERROR,
                    message: { id: 'Failed to download logs' },
                    secondaryMessage: {
                        id: 'Please try again or contact support if the problem persists.',
                    },
                }),
            );
        } finally {
            setIsDownloadingLogs(false);
        }
    };

    return (
        <ul className="nav navbar-nav float-right">
            <Dropdown
                tag="li"
                className="nav-item"
                isOpen={isDropdownOpen}
                toggle={toggleDropdown}
            >
                <StyledDropdownToggle
                    tag="a"
                    className="nav-link text-height-1"
                    tabIndex={0}
                >
                    {user ? (
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
                    ) : (
                        <Settings size={20} color={theme.baseColors.white} />
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

                    <StyledDropdownItem onClick={openLanguageModal}>
                        <Globe size={14} className="mr-50" />
                        <span>{_t({ id: 'Change Language' })}</span>
                    </StyledDropdownItem>

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
                        onClick={handleDownloadLogs}
                        disabled={isDownloadingLogs}
                        toggle={false}
                    >
                        {isDownloadingLogs ? (
                            <SpinningLoader size={14} className="mr-50" />
                        ) : (
                            <Download size={14} className="mr-50" />
                        )}
                        <span>
                            {isDownloadingLogs
                                ? _t({ id: 'Preparing Logs...' })
                                : _t({ id: 'Download Logs' })}
                        </span>
                    </StyledDropdownItem>

                    <StyledDropdownItem
                        onClick={() =>
                            bridge.invoke('openLink', config.url.help)
                        }
                    >
                        <HelpCircle size={14} className="mr-50" />
                        <span>{_t({ id: 'Help' })}</span>
                    </StyledDropdownItem>

                    <StyledDropdownItem
                        onClick={
                            hasAccessToken
                                ? clearRegistration
                                : openRegisterModal
                        }
                    >
                        <AtSign size={14} className="mr-50" />
                        <span>
                            {hasAccessToken
                                ? _t({
                                      id: 'Disconnect Device',
                                  })
                                : _t({
                                      id: 'Register',
                                  })}
                        </span>
                    </StyledDropdownItem>

                    <DropdownItem divider />

                    <StyledDropdownItem
                        onClick={() => bridge.invoke('quitApp')}
                    >
                        <Power size={14} className="mr-50" />
                        <span>{_t({ id: 'Quit Agent' })}</span>
                    </StyledDropdownItem>
                </DropdownMenu>
            </Dropdown>

            <Modal isOpen={activeModal === 'register'} toggle={closeModal}>
                <StyledModalHeader toggle={closeModal}>
                    {_t({ id: 'Register Device' })}
                </StyledModalHeader>
                <LocalRegisterForm />
                <Button onClick={closeModal}>{_t({ id: 'Cancel' })}</Button>
            </Modal>

            <Modal isOpen={activeModal === 'language'} toggle={closeModal}>
                <StyledModalHeader toggle={closeModal}>
                    {_t({ id: 'Change Language' })}
                </StyledModalHeader>
                <LanguageForm onClose={closeModal} />
                <Button onClick={closeModal}>{_t({ id: 'Cancel' })}</Button>
            </Modal>
        </ul>
    );
}

export { SettingsMenu };
