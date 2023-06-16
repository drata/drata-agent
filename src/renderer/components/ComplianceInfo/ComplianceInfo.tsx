import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { forEach } from 'lodash';

import { theme } from '@drata/component-library';
import { Accordion } from '../Accordion/Accordion';
import { AccordionItem } from '../Accordion/AccordionItem';
import { ComplianceInfoHeader } from './ComplianceInfoHeader';
import { CounterBadge } from './CounterBadge';
import { ComplianceListItem } from './ComplianceListItem';
import { AlertCircle, CheckCircle } from 'react-feather';
import { MessageBanner } from './MessageBanner';

import { selectComplianceChecks } from '../../redux/selectors/data-store.selectors';
import { _t } from '../../helpers/intl.helpers';
import { ComplianceCheckResponseDto } from '../../../main/services/api/dtos/compliance-check-response.dto';
import { ComplianceCheckType } from '../../../enums/compliance-check-type.enum';

const BodyWrapper = styled.main`
    overflow-y: auto;
    background-color: ${({ theme }) => theme.baseColors.cultured};
    padding: 0.5rem;
`;

function ComplianceInfo() {
    const complianceChecks = useSelector(selectComplianceChecks);

    const { passed, failed, allPassed, allFailed } = useMemo(() => {
        const passed: ComplianceCheckResponseDto[] = [];
        const failed: ComplianceCheckResponseDto[] = [];

        const complianceCheckTypes = Object.keys(ComplianceCheckType);

        forEach(complianceChecks, complianceCheck => {
            if (complianceCheckTypes.includes(complianceCheck.type)) {
                if (complianceCheck.compliant) {
                    passed.push(complianceCheck);
                } else {
                    failed.push(complianceCheck);
                }
            }
        });

        const total = passed.length + failed.length;

        const allPassed = total > 0 && passed.length === total;
        const allFailed = total > 0 && failed.length === total;

        return { passed, failed, allPassed, allFailed };
    }, [complianceChecks]);

    return (
        <BodyWrapper>
            <MessageBanner
                allPassed={allPassed}
                complianceChecksCount={complianceChecks.length}
            />

            <ul>
                <Accordion>
                    <AccordionItem
                        id="summary-compliance-check-items"
                        key="summary-compliance-check-items"
                        header={
                            <ComplianceInfoHeader
                                title={_t({ id: 'Configure your computer' })}
                                icon={
                                    <CheckCircle
                                        color={
                                            allPassed
                                                ? theme.statusColors.success
                                                : theme.baseColors.dustyGray
                                        }
                                        size={28}
                                    />
                                }
                                subheader={
                                    <CounterBadge
                                        total={passed.length + failed.length}
                                        passed={passed.length}
                                    />
                                }
                            />
                        }
                    >
                        {allPassed && (
                            <ul>
                                {passed.map(complianceCheck => (
                                    <ComplianceListItem
                                        key={`compliance-check-item-${complianceCheck.id}`}
                                        complianceCheck={complianceCheck}
                                    ></ComplianceListItem>
                                ))}
                            </ul>
                        )}
                    </AccordionItem>

                    {complianceChecks.length === 0 || allPassed ? null : (
                        <AccordionItem
                            id="passing-compliance-check-items"
                            key="passing-compliance-check-items"
                            header={
                                <ComplianceInfoHeader
                                    title={_t({ id: 'Incomplete' })}
                                    icon={
                                        <AlertCircle
                                            color={theme.statusColors.danger}
                                            size={28}
                                        />
                                    }
                                    subheader={_t({
                                        id: 'The following tasks are not compliant and need attention',
                                    })}
                                />
                            }
                        >
                            <ul>
                                {failed.map(complianceCheck => (
                                    <ComplianceListItem
                                        key={`compliance-check-item-${complianceCheck.id}`}
                                        complianceCheck={complianceCheck}
                                    ></ComplianceListItem>
                                ))}
                            </ul>
                        </AccordionItem>
                    )}

                    {complianceChecks.length === 0 ||
                    allPassed ||
                    allFailed ? null : (
                        <AccordionItem
                            id="failing-compliance-check-items"
                            key="failing-compliance-check-items"
                            header={
                                <ComplianceInfoHeader
                                    title={_t({ id: 'Completed' })}
                                    icon={
                                        <CheckCircle
                                            color={theme.statusColors.success}
                                            size={28}
                                        />
                                    }
                                    subheader={_t({
                                        id: 'The following tasks are completed and compliant',
                                    })}
                                />
                            }
                        >
                            <ul>
                                {passed.map(complianceCheck => (
                                    <ComplianceListItem
                                        key={`compliance-check-item-${complianceCheck.id}`}
                                        complianceCheck={complianceCheck}
                                    ></ComplianceListItem>
                                ))}
                            </ul>
                        </AccordionItem>
                    )}
                </Accordion>
            </ul>
        </BodyWrapper>
    );
}

export { ComplianceInfo };
