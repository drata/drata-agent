import React, { useState } from 'react';
import { useBridge } from '../../hooks/use-bridge.hook';
import { isEmpty, map } from 'lodash';
import { Region } from '../../../enums/region.enum';
import { Button, Input, Label } from 'reactstrap';
import styled from 'styled-components';

const BodyWrapper = styled.main`
    padding: 1.5rem;
    margin: 0;
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
            <form onSubmit={onSubmit}>
                <Label htmlFor="token">Registration Key</Label>
                <Input
                    name="token"
                    type="text"
                    value={token}
                    onChange={onChangeInput}
                />
                <Label htmlFor="region">Region</Label>
                <Input
                    type="select"
                    name="region"
                    onChange={e => onChangeSelect(e)}
                >
                    {map(Region, (value, key) => (
                        <option value={key} key={key}>
                            {value}
                        </option>
                    ))}
                </Input>
                <br />
                <Button color="primary" type="submit">
                    Register
                </Button>
            </form>
        </BodyWrapper>
    );
}

export { LocalRegisterForm };
