import { css } from 'styled-components';

const cardBase = css`
    background-color: ${({ theme }) => theme.baseColors.white};
    box-shadow: ${({ theme }) => theme.boxShadows.dp1};
    border-radius: 0.5rem;
`;

const linkHighlight = css`
    &:hover,
    &:focus {
        text-decoration: underline;
        box-shadow: none;
    }
`;

export { cardBase, linkHighlight };
