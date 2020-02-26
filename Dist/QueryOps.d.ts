export declare abstract class QueryOp {
    static ParseData(json: any): WhereOp | OrderByOp;
    type: "where" | "orderBy";
    abstract Apply(collection: firebase.firestore.CollectionReference): any;
}
export declare class WhereOp extends QueryOp {
    constructor(fieldPath: string, comparison: firebase.firestore.WhereFilterOp, value: any);
    fieldPath: string;
    comparison: firebase.firestore.WhereFilterOp;
    value: any;
    Apply(collection: firebase.firestore.CollectionReference): import("firebase").firestore.Query<import("firebase").firestore.DocumentData>;
}
export declare class OrderByOp extends QueryOp {
    constructor(fieldPath: string, direction?: firebase.firestore.OrderByDirection);
    fieldPath: string;
    direction: firebase.firestore.OrderByDirection;
    Apply(collection: firebase.firestore.CollectionReference): import("firebase").firestore.Query<import("firebase").firestore.DocumentData>;
}
