export interface FilterQuery {
    filter?: {
        categories: string[],
    };
    limit?: number;
    offset?: number;
}
