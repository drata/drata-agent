import { Theme } from '@drata/component-library';
import { isEmpty } from 'lodash';
import React, { useContext, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Button, Input, Label } from 'reactstrap';
import styled from 'styled-components';
import { _t } from '../../helpers/intl.helpers';
import { useBridge } from '../../hooks/use-bridge.hook';
import { IntlContext } from '../../utility/IntlProvider';

// Import SVG files
import flagDe from '../../../assets/svg/flag-de.svg';
import flagFr from '../../../assets/svg/flag-fr.svg';
import flagMx from '../../../assets/svg/flag-mx.svg';
import flagUs from '../../../assets/svg/flag-us.svg';

const BodyWrapper = styled.main`
    padding: 1rem;
    margin: 0;
    display: flex;
    justify-content: center;
`;

const FormContainer = styled.div<{ theme: Theme }>`
    background-color: ${({ theme }) => theme.baseColors.white};
    border-radius: 0.5rem;
    box-shadow: ${({ theme }) => theme.boxShadows.dp1};
    padding: 1.5rem;
    width: 100%;
    max-width: 400px;
`;

const FormTitle = styled.h2<{ theme: Theme }>`
    color: ${({ theme }) => theme.baseColors.spaceCadet};
    font-size: 1.3rem;
    margin-bottom: 1rem;
    text-align: center;
`;

const FormGroup = styled.div`
    margin-bottom: 1rem;
`;

const StyledLabel = styled(Label)<{ theme: Theme }>`
    color: ${({ theme }) => theme.baseColors.spaceCadet};
    font-weight: 500;
    margin-bottom: 0.5rem;
    display: block;
`;

const StyledInput = styled(Input)<{ theme: Theme }>`
    border: 1px solid ${({ theme }) => theme.borderColors.dark.low};
    border-radius: 0.25rem;
    padding: 0.5rem;
    font-size: 0.9rem;
    width: 100%;
    transition: border-color 0.2s ease;

    &:focus {
        border-color: ${({ theme }) => theme.baseColors.spaceCadet};
        box-shadow: 0 0 0 0.2rem rgba(28, 37, 65, 0.15);
    }
`;

const StyledButton = styled(Button)<{ theme: Theme }>`
    background-color: ${({ theme }) => theme.baseColors.spaceCadet};
    border: none;
    border-radius: 0.25rem;
    color: white;
    font-weight: 500;
    padding: 0.6rem 1.5rem;
    width: 100%;
    transition: background-color 0.2s ease;
    margin-top: 0.25rem;

    &:hover {
        background-color: ${({ theme }) => theme.statusColors.info};
    }
`;

const StyledP = styled.p<{ theme: Theme }>`
    margin-bottom: 1rem;
    color: ${({ theme }) => theme.baseColors.spaceCadet};
    font-size: 0.9rem;
`;

const StyledFlagImg = styled.img`
    height: 20px;
    margin-right: 8px;
    vertical-align: middle;
`;

const SelectWrapper = styled.div`
    position: relative;
    width: 100%;
`;

const SelectButton = styled.button<{ theme: Theme }>`
    width: 100%;
    padding: 0.5rem;
    border: 1px solid ${({ theme }) => theme.borderColors.dark.low};
    border-radius: 0.25rem;
    background: white;
    text-align: left;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    font-size: 0.9rem;
    position: relative;

    &:focus {
        border-color: ${({ theme }) => theme.baseColors.spaceCadet};
        box-shadow: 0 0 0 0.2rem rgba(28, 37, 65, 0.15);
        outline: none;
    }

    &::after {
        content: '';
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 5px solid ${({ theme }) => theme.baseColors.spaceCadet};
        margin-left: 8px;
    }
`;

const OptionsList = styled.div<{ theme: Theme; 'data-is-open'?: boolean }>`
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid ${({ theme }) => theme.borderColors.dark.low};
    border-radius: 0.25rem;
    margin-top: 0.25rem;
    display: ${({ 'data-is-open': isOpen }) => (isOpen ? 'block' : 'none')};
    z-index: 1000;
    max-height: 200px;
    overflow-y: auto;
`;

const Option = styled.div<{ theme: Theme; 'data-selected'?: boolean }>`
    padding: 0.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    background: ${({ 'data-selected': isSelected, theme }) =>
        isSelected ? theme.statusColors.info + '20' : 'white'};

    &:hover {
        background: ${({ theme }) => theme.statusColors.info + '10'};
    }
`;

// Language options with their respective flags and labels
const LANGUAGE_OPTIONS = [
    {
        value: 'en-US',
        label: 'English',
        icon: flagUs,
    },
    {
        value: 'es-LA',
        label: 'Español',
        icon: flagMx,
    },
    {
        value: 'de-DE',
        label: 'Deutsch',
        icon: flagDe,
    },
    {
        value: 'fr-FR',
        label: 'Français',
        icon: flagFr,
    },
];

function LanguageForm({ onClose }: { onClose?: () => void }) {
    const bridge = useBridge();
    const intlContext = useContext(IntlContext);
    const intl = useIntl();
    const [language, setLanguage] = useState(intl.locale || 'en-US');
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const onSubmit: React.FormEventHandler<HTMLFormElement> = e => {
        e.preventDefault();
        if (!isEmpty(language)) {
            intlContext?.switchLanguage(language);
            bridge.invoke('changeLanguage', language);
            onClose?.();
        }
    };

    // We don't need the useEffect for blur handling

    const selectedOption = LANGUAGE_OPTIONS.find(opt => opt.value === language);

    return (
        <BodyWrapper>
            <FormContainer>
                <FormTitle>{_t({ id: 'Language Settings' })}</FormTitle>
                <StyledP>
                    {_t({
                        id: 'Use this form to update your personal language settings for the Drata Agent.',
                    })}
                </StyledP>
                <form onSubmit={onSubmit}>
                    <FormGroup>
                        <StyledLabel htmlFor="language">Language</StyledLabel>
                        <SelectWrapper
                            ref={dropdownRef}
                            onBlur={e => {
                                // Check if the related target is inside the dropdown
                                if (
                                    !dropdownRef.current?.contains(
                                        e.relatedTarget as Node,
                                    )
                                ) {
                                    setIsOpen(false);
                                }
                            }}
                            tabIndex={-1} // Needed to receive blur events
                        >
                            <SelectButton
                                type="button"
                                onClick={() => setIsOpen(!isOpen)}
                                aria-haspopup="listbox"
                                aria-expanded={isOpen}
                            >
                                <div>
                                    {selectedOption && (
                                        <>
                                            <StyledFlagImg
                                                src={selectedOption.icon}
                                                alt={selectedOption.label}
                                            />
                                            {selectedOption.label}
                                        </>
                                    )}
                                </div>
                            </SelectButton>
                            <OptionsList data-is-open={isOpen}>
                                {LANGUAGE_OPTIONS.map(option => (
                                    <Option
                                        key={option.value}
                                        data-selected={
                                            option.value === language
                                        }
                                        onClick={() => {
                                            setLanguage(option.value);
                                            setIsOpen(false);
                                        }}
                                    >
                                        <StyledFlagImg
                                            src={option.icon}
                                            alt={option.label}
                                        />
                                        {option.label}
                                    </Option>
                                ))}
                            </OptionsList>
                        </SelectWrapper>
                    </FormGroup>
                    <StyledButton color="primary" type="submit">
                        {_t({ id: 'Save' })}
                    </StyledButton>
                </form>
            </FormContainer>
        </BodyWrapper>
    );
}

export { LanguageForm };
