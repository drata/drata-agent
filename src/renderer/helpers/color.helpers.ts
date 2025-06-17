import convert from 'color-convert';

const isHexColor = (color: string): boolean =>
    /^#?(?:[a-f0-9]{3}){1,2}$/i.test(color);

const rgba = (color: string, alpha = 1): string => {
    const rgb = isHexColor(color) ? convert.hex.rgb(color) : [color];
    return `rgba(${[rgb, alpha]})`;
};

export { isHexColor, rgba };
