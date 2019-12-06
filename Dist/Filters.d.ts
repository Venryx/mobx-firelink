export declare abstract class Filter {
    abstract Apply(collection: firebase.firestore.CollectionReference): any;
}
export declare class WhereFilter extends Filter {
    constructor(propPath: string, comparison: firebase.firestore.WhereFilterOp, value: string);
    fieldPath: string;
    comparison: firebase.firestore.WhereFilterOp;
    value: string;
    Apply(collection: firebase.firestore.CollectionReference): import("firebase").firestore.Query;
}
export declare const Where: (propPath: string, comparison: import("firebase").firestore.WhereFilterOp, value: string) => WhereFilter;
