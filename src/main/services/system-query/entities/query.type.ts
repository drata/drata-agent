export type Query = {
    description: string;
    query?: string;
    command?: string;
    transform?: (result: any) => any;
};
