function truncateString(value: string, length = 0) {
    if (value.length <= length || length === 0) {
        return value;
    }

    return `${value.slice(0, length)} ...`;
}

export { truncateString };
