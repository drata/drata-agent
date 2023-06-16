declare module '@drata/component-library' {
    // #region helper functions

    /**
     * Defines whether to use singular or plural
     * @param {String} plural
     * @param {String} singular
     * @param {Number} count
     * @returns {String}
     */
    type PluralizeWordFnType = <P extends string, S extends string>(
        plural: P,
        singular: S,
        count: number,
    ) => P | S;

    export const pluralizeWord: PluralizeWordFnType;

    /**
     * Format a datetime string (converts UTC to local time)
     * @param  {String} value  Datetime value
     * @param  {String} format Moment format tokens
     * @return {String}        Formatted date and time
     */
    type GetLocalFormatedDatetimeFnType = (
        value?: string,
        format?: 'MM/DD/YYYY' | 'MMM DD, YYYY @ h:mm:ss A',
    ) => string;

    export const getLocalFormatedDatetime: GetLocalFormatedDatetimeFnType;

    /**
     * Format a datetime string into time from now
     * @param  {String} value  Datetime value
     * @return {String}        Formatted date and time
     */
    type GetLocalTimeFromNowFnType = (value: string) => string;

    export const getLocalTimeFromNow: GetLocalTimeFromNowFnType;

    // #endregion

    // styled.d.ts

    export type Theme = {
        baseColors: BaseColors;
        statusColors: StatusColors;
        textColors: TextColors;
        borderColors: BorderColors;
        backgroundColors: BackgroundColors;
        boxShadows: BoxShadows;
        zIndex: ZIndex;
    };

    const theme: Theme;

    const buttonReset: any;

    const toast: {
        success: (message: string, options?: ToastOptions) => ReactText;
        warning: (message: string, options?: ToastOptions) => ReactText;
        error: (message: string, options?: ToastOptions) => ReactText;
        configure: (config?: any) => void;
        POSITION: {
            TOP_LEFT: ToastPosition;
            TOP_RIGHT: ToastPosition;
            TOP_CENTER: ToastPosition;
            BOTTOM_LEFT: ToastPosition;
            BOTTOM_RIGHT: ToastPosition;
            BOTTOM_CENTER: ToastPosition;
        };
    };

    // #region components

    type DrataIconLightType = (props: {
        className?: string;
        height?: string | number;
        width?: string | number;
    }) => JSX.Element;

    export const DrataIconLight: DrataIconLightType;

    type ButtonType = (
        props: {
            children?: ReactElement;
            disabled?: boolean;
            isLoading?: boolean;
            outline?: boolean;
        } & ButtonProps,
    ) => JSX.Element;

    export const Button: ButtonType;

    type UserType = (props: {
        firstName: string;
        lastName: string;
        className?: string;
        showAvatar?: boolean;
        avatarUrl?: string;
        size?: 'md' | 'lg';
        direction?: 'ltr' | 'rtl';
        subText?: string;
    }) => JSX.Element;

    export const User: UserType;

    // #endregion

    // #region secondary definitions

    type ToastPosition =
        | 'top-right'
        | 'top-center'
        | 'top-left'
        | 'bottom-right'
        | 'bottom-center'
        | 'bottom-left';

    interface ToastOptions extends CommonOptions {
        className?: ToastClassName;
        onOpen?: <T = {}>(props: T) => void;
        onClose?: <T = {}>(props: T) => void;
        style?: React.CSSProperties;
        type?: TypeOptions;
        toastId?: Id;
        updateId?: Id;
        progress?: number | string;
        delay?: number;
    }

    interface ButtonProps
        extends React.ButtonHTMLAttributes<HTMLButtonElement> {
        [key: string]: any;
        outline?: boolean;
        active?: boolean;
        block?: boolean;
        color?: string;
        tag?: React.ElementType;
        innerRef?: React.Ref<HTMLButtonElement>;
        size?: string;
        cssModule?: CSSModule;
        close?: boolean;
    }
    interface BaseColors {
        spaceCadet: string;
        saphireBlue: string;
        carolinaBlue: string;
        limeGreen: string;
        orangePeel: string;
        imperialRed: string;
        barney: string;
        violet: string;
        black: string;
        mineShaft: string;
        jet: string;
        doveGray: string;
        dustyGray: string;
        alto: string;
        loblolly: string;
        geyser: string;
        whiteLilac: string;
        cultured: string;
        concrete: string;
        gallery: string;
        white: string;
        redBeech: string;
    }
    interface StatusColors {
        primary: string;
        secondary: string;
        info: string;
        success: string;
        warning: string;
        danger: string;
    }
    interface TextColors {
        dark: Dark;
        light: string;
        primary: string;
        secondary: string;
        info: string;
        success: string;
        warning: string;
        danger: string;
    }
    interface Dark {
        high: string;
        medium: string;
        low: string;
    }
    interface BorderColors {
        dark: Dark;
    }
    interface BackgroundColors {
        primary: PrimaryOrSuccessOrWarningOrDanger;
        success: PrimaryOrSuccessOrWarningOrDanger;
        warning: PrimaryOrSuccessOrWarningOrDanger;
        danger: PrimaryOrSuccessOrWarningOrDanger;
    }
    interface PrimaryOrSuccessOrWarningOrDanger {
        filled: string;
        transparent: string;
    }
    interface BoxShadows {
        dp0: string;
        dp1: string;
        dp2: string;
        dp3: string;
        dp4: string;
        dp5: string;
        dp8: string;
        dp13: string;
        dp21: string;
    }
    interface ZIndex {
        drawer: number;
        drawerBackdrop: number;
        modal: number;
        modalBackdrop: number;
        alert: number;
        alertBackdrop: number;
        tooltip: number;
    }

    // #endregion
}
