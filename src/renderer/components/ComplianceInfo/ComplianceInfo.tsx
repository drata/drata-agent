import { forEach } from 'lodash';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { Theme, theme } from '@drata/component-library';
import { AlertCircle, CheckCircle } from 'react-feather';
import { Accordion } from '../Accordion/Accordion';
import { AccordionItem } from '../Accordion/AccordionItem';
import { ComplianceInfoHeader } from './ComplianceInfoHeader';
import { ComplianceListItem } from './ComplianceListItem';
import { CounterBadge } from './CounterBadge';
import { MessageBanner } from './MessageBanner';

import { ComplianceCheckStatus } from '../../../enums/compliance-check-status.enum';
import { ComplianceCheckType } from '../../../enums/compliance-check-type.enum';
import { ComplianceCheckResponseDto } from '../../../main/services/api/dtos/compliance-check-response.dto';
import { _t } from '../../helpers/intl.helpers';
import { selectComplianceChecks } from '../../redux/selectors/data-store.selectors';

const BodyWrapper = styled.main<{ theme: Theme }>`
    overflow-y: auto;
    background-color: ${({ theme }) => theme.baseColors.cultured};
    padding: 0.5rem;
`;

function ComplianceInfo() {
    const complianceChecks = useSelector(selectComplianceChecks)?.filter(
        c => c.status !== ComplianceCheckStatus.EXCLUDED,
    );

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
