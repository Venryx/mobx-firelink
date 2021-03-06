export declare abstract class Filter {
    static ParseData(json: any): WhereFilter;
    type: "where";
    abstract Apply(collection: firebase.firestore.CollectionReference): any;
}
export declare class WhereFilter extends Filter {
    constructor(fieldPath: string, comparison: firebase.firestore.WhereFilterOp, value: any);
    fieldPath: string;
    comparison: firebase.firestore.WhereFilterOp;
    value: any;
    Apply(collection: firebase.firestore.CollectionReference): import("firebase").firestore.Query<import("firebase").firestore.DocumentData>;
}
export declare const Where: (fieldPath: string, comparison: import("firebase").firestore.WhereFilterOp, value: any) => WhereFilter;
