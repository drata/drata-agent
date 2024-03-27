export const pivotResultRows = ({
    rows,
    keyName,
    valueName,
}: {
    rows: any[];
    keyName: string;
    valueName: string;
}): any => {
    return rows?.reduce(
        (prev, cur) => ({
            ...prev,
            [cur[keyName]]: cur[valueName],
        }),
        {},
    );
};
