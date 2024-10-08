import { ObservableMap } from "mobx";
import { QueryOp } from "../QueryOps.js";
import { Firelink } from "../Firelink.js";
import { CollectionReference } from "firebase/firestore";
export declare enum TreeNodeType {
    Root = 0,
    Collection = 1,
    CollectionQuery = 2,
    Document = 3
}
export declare enum DataStatus {
    Initial = 0,
    Waiting = 1,
    Received_Cache = 2,
    Received_Full = 3
}
export declare class PathSubscription {
    constructor(unsubscribe: () => void);
    unsubscribe: () => void;
}
export declare class QueryRequest {
    static ParseString(dataStr: string): QueryRequest;
    static ParseData(data: any): QueryRequest;
    constructor(initialData?: Partial<QueryRequest>);
    queryOps: QueryOp[];
    Apply(collection: CollectionReference): CollectionReference<import("@firebase/firestore").DocumentData, import("@firebase/firestore").DocumentData>;
    toString(): string;
}
export declare function PathSegmentsAreValid(pathSegments: string[]): boolean;
export declare class TreeNode<DataShape> {
    constructor(fire: Firelink<any, any>, pathOrSegments: string | string[]);
    fire: Firelink<any, any>;
    pathSegments: string[];
    pathSegments_noQuery: string[];
    path: string;
    path_noQuery: string;
    type: TreeNodeType;
    Request(): void;
    Subscribe(): void;
    Unsubscribe(): PathSubscription | null;
    UnsubscribeAll(): void;
    status: DataStatus;
    subscription: PathSubscription | null;
    collectionNodes: ObservableMap<string, TreeNode<any>>;
    data: DataShape;
    dataJSON: string;
    SetData(data: DataShape, fromCache: boolean): boolean;
    queryNodes: ObservableMap<string, TreeNode<any>>;
    query?: QueryRequest;
    docNodes: ObservableMap<string, TreeNode<any>>;
    get docDatas(): any[];
    Get(subpathOrGetterFunc: string | string[] | ((data: DataShape) => any), query?: QueryRequest, createTreeNodesIfMissing?: boolean): TreeNode<any> | null;
    get raw(): DataShape;
    AsRawData(addTreeLink?: boolean): DataShape;
    UploadRawData(rawData: DataShape): void;
}
export declare function GetTreeNodeTypeForPath(pathOrSegments: string | string[]): TreeNodeType;
export declare function TreeNodeToRawData<DataShape>(treeNode: TreeNode<DataShape>, addTreeLink?: boolean): DataShape;
