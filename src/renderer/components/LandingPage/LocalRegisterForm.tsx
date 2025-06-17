import { Theme } from '@drata/component-library';
import { isEmpty, map } from 'lodash';
import React, { useState } from 'react';
import { Button, Input, Label } from 'reactstrap';
import styled from 'styled-components';
import { Region } from '../../../enums/region.enum';
import { _t } from '../../helpers/intl.helpers';
import { useBridge } from '../../hooks/use-bridge.hook';

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

function LocalRegisterForm() {
    const bridge = useBridge();
    const [token, setToken] = useState('');
    const [region, setRegion] = useState(Region.NA);

    const onSubmit: React.FormEventHandler<HTMLFormElement> = () => {
        if (!isEmpty(token)) {
            bridge.invoke('localRegister', { token, region });
        }
    };

    const onChangeInput: React.ChangeEventHandler<HTMLInputElement> = evt => {
        setToken(evt.target.value);
    };

    const onChangeSelect: React.ChangeEventHandler<HTMLInputElement> = evt => {
        setRegion(evt.target.value as Region);
    };

    return (
        <BodyWrapper>
            <FormContainer>
                <FormTitle>{_t({ id: 'Register Your Account' })}</FormTitle>
                <form onSubmit={onSubmit}>
                    <FormGroup>
                        <StyledLabel htmlFor="token">
                            {_t({ id: 'Registration Key' })}
                        </StyledLabel>
                        <StyledInput
                            name="token"
                            type="text"
                            value={token}
                            onChange={onChangeInput}
                            placeholder={_t({
                                id: 'Enter your registration key',
                            })}
                        />
                    </FormGroup>
                    <FormGroup>
                        <StyledLabel htmlFor="region">
                            {_t({ id: 'Region' })}
                        </StyledLabel>
                        <StyledInput
                            type="select"
                            name="region"
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>,
                            ) => onChangeSelect(e)}
                        >
                            {map(Region, (value, key) => (
                                <option value={key} key={key}>
                                    {value}
                                </option>
                            ))}
                        </StyledInput>
                    </FormGroup>
                    <StyledButton color="primary" type="submit">
                        {_t({ id: 'Register' })}
                    </StyledButton>
                </form>
            </FormContainer>
        </BodyWrapper>
    );
}

export { LocalRegisterForm };
