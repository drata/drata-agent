import { theme } from '@drata/component-library';
import React from 'react';

interface Props {
    isCompliant: boolean;
}

function ComplianceListItemIcon({ isCompliant }: Props) {
    if (isCompliant) {
        return (
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <circle
                    cx="12"
                    cy="12"
                    r="12"
                    fill={theme.statusColors.success}
                />
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M13.7483 8.07641C12.9022 7.69942 11.9569 7.60602 11.0534 7.81016C10.1499 8.01429 9.33654 8.50502 8.73472 9.20916C8.13289 9.91329 7.7748 10.7931 7.71386 11.7174C7.65291 12.6416 7.89237 13.5609 8.39653 14.3379C8.90068 15.115 9.64252 15.7083 10.5114 16.0293C11.3803 16.3503 12.3296 16.3818 13.2179 16.1192C14.1062 15.8565 14.8858 15.3138 15.4404 14.5719C15.995 13.83 16.2949 12.9287 16.2955 12.0025V11.5636C16.2955 11.3 16.5091 11.0864 16.7727 11.0864C17.0363 11.0864 17.25 11.3 17.25 11.5636V12.0027C17.2494 13.1349 16.8828 14.2367 16.2049 15.1435C15.527 16.0502 14.5742 16.7136 13.4886 17.0345C12.4029 17.3555 11.2426 17.317 10.1806 16.9247C9.11863 16.5323 8.21194 15.8072 7.59575 14.8575C6.97956 13.9077 6.68689 12.7842 6.76138 11.6546C6.83587 10.5249 7.27353 9.44958 8.0091 8.58897C8.74466 7.72836 9.73871 7.12858 10.843 6.87908C11.9473 6.62958 13.1026 6.74373 14.1367 7.20451C14.3775 7.31179 14.4857 7.59394 14.3785 7.83471C14.2712 8.07548 13.989 8.18369 13.7483 8.07641Z"
                    fill={theme.baseColors.white}
                />
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M17.11 7.84665C17.2964 8.03295 17.2966 8.33514 17.1103 8.52162L12.3376 13.2991C12.2481 13.3887 12.1267 13.439 12 13.4391C11.8734 13.4391 11.752 13.3888 11.6624 13.2993L10.2306 11.8675C10.0442 11.6811 10.0442 11.3789 10.2306 11.1925C10.417 11.0061 10.7192 11.0061 10.9056 11.1925L11.9997 12.2867L16.435 7.84699C16.6213 7.66051 16.9235 7.66036 17.11 7.84665Z"
                    fill={theme.baseColors.white}
                />
            </svg>
        );
    }

    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle cx="12" cy="12" r="12" fill={theme.baseColors.loblolly} />
            <circle
                cx="12"
                cy="12"
                r="4.65"
                stroke={theme.baseColors.white}
                strokeWidth="1.2"
            />
            <circle cx="20" cy="4" r="4" fill={theme.statusColors.danger} />
            <circle cx="20" cy="4" r="4" fill={theme.statusColors.danger} />
        </svg>
    );
}

export { ComplianceListItemIcon };
