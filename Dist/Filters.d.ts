export declare class Filter {
}
export declare class WhereFilter extends Filter {
    constructor(propPath: string, comparison: string, value: string);
    propPath: string;
    comparison: string;
    value: string;
}
export declare const Where: (propPath: string, comparison: string, value: string) => WhereFilter;
