import { CollectionReference, OrderByDirection, WhereFilterOp } from "firebase/firestore";
export type QueryOpType = "where" | "orderBy" | "limit";
export declare abstract class QueryOp {
    static ParseData(json: any): WhereOp | OrderByOp | LimitOp;
    type: QueryOpType;
    abstract Apply(collection: CollectionReference): any;
}
export declare class WhereOp extends QueryOp {
    fieldPath: string;
    comparison: WhereFilterOp;
    value: any;
    constructor(fieldPath: string, comparison: WhereFilterOp, value: any);
    Apply(collection: CollectionReference): import("@firebase/firestore").Query<import("@firebase/firestore").DocumentData, import("@firebase/firestore").DocumentData>;
}
export declare class OrderByOp extends QueryOp {
    fieldPath: string;
    direction: OrderByDirection;
    constructor(fieldPath: string, direction?: OrderByDirection);
    Apply(collection: CollectionReference): import("@firebase/firestore").Query<import("@firebase/firestore").DocumentData, import("@firebase/firestore").DocumentData>;
}
export declare class LimitOp extends QueryOp {
    count: number;
    constructor(count: number);
    Apply(collection: CollectionReference): import("@firebase/firestore").Query<import("@firebase/firestore").DocumentData, import("@firebase/firestore").DocumentData>;
}
