import React, { cloneElement, ReactElement, useEffect, useState } from 'react';
import styled from 'styled-components';
import { isEmpty } from 'lodash';
import { useHistory, useParams } from 'react-router-dom';

import { AccordionItem } from './AccordionItem';

import { cardBase } from '../../../renderer/helpers/style.helpers';
import { reverse } from '../../../renderer/helpers/route.helpers';
import { AppRoute } from '../app-route.enum';

const Li = styled.li`
    ${cardBase}
    width: 100%;

    &:not(:last-child) {
        margin-bottom: 0.5rem;
    }
`;

interface Props {
    children: Array<ReactElement<Parameters<typeof AccordionItem>[0]> | null>;
}

function Accordion({ children }: Props) {
    const [activeIndex, setActiveIndex] = useState(-1);
    const { openItem } = useParams<{ openItem?: string }>();
    const history = useHistory();

    const itemIds = children
        .map(item => item?.props.id)
        .filter(itemId => !!itemId);

    useEffect(() => {
        setActiveIndex(itemIds.indexOf(openItem));
    }, [itemIds, openItem]);

    const handleOnClick = (index: number) => () => {
        if (index === activeIndex) {
            history.replace(reverse(AppRoute.HOME, { openItem: '' }));
        } else {
            history.replace(
                // ! is safe to use because itemIds[index] is guaranteed to exist
                reverse(AppRoute.HOME, { openItem: itemIds[index]! }),
            );
        }
    };

    return (
        <>
            {children.map(
                (item, index) =>
                    !!item && (
                        <Li key={item.key}>
                            {cloneElement(item, {
                                isOpen: activeIndex === index,
                                onClick: !isEmpty(item.props?.children)
                                    ? handleOnClick(index)
                                    : undefined,
                                ...item.props,
                            })}
                        </Li>
                    ),
            )}
        </>
    );
}

export { Accordion };
