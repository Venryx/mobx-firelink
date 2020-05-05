export declare type QueryOpType = "where" | "orderBy" | "limit";
export declare abstract class QueryOp {
    static ParseData(json: any): WhereOp | OrderByOp | LimitOp;
    type: QueryOpType;
    abstract Apply(collection: firebase.firestore.CollectionReference): any;
}
export declare class WhereOp extends QueryOp {
    fieldPath: string;
    comparison: firebase.firestore.WhereFilterOp;
    value: any;
    constructor(fieldPath: string, comparison: firebase.firestore.WhereFilterOp, value: any);
    Apply(collection: firebase.firestore.CollectionReference): import("firebase").firestore.Query<import("firebase").firestore.DocumentData>;
}
export declare class OrderByOp extends QueryOp {
    fieldPath: string;
    direction: firebase.firestore.OrderByDirection;
    constructor(fieldPath: string, direction?: firebase.firestore.OrderByDirection);
    Apply(collection: firebase.firestore.CollectionReference): import("firebase").firestore.Query<import("firebase").firestore.DocumentData>;
}
export declare class LimitOp extends QueryOp {
    count: number;
    constructor(count: number);
    Apply(collection: firebase.firestore.CollectionReference): import("firebase").firestore.Query<import("firebase").firestore.DocumentData>;
}
