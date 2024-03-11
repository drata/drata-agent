function truncateString(value: string, length = 0) {
    if (length <= 0 || value.length <= length) {
        return value;
    }

    return `${value.slice(0, length)} ...`;
}

function parseIntOrUndefined(value: any): number | undefined {
    const ret = parseInt(value);
    return isNaN(ret) ? undefined : ret;
}

export { parseIntOrUndefined, truncateString };
