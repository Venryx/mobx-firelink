import { ObservableMap } from "mobx";
import { Filter } from "../Filters";
import { Firelink } from "../Firelink";
export declare enum TreeNodeType {
    Root = 0,
    Collection = 1,
    CollectionQuery = 2,
    Document = 3
}
export declare enum DataStatus {
    Initial = 0,
    Waiting = 1,
    Received = 2
}
export declare class PathSubscription {
    constructor(unsubscribe: () => void);
    unsubscribe: () => void;
}
export declare class QueryRequest {
    static ParseString(dataStr: string): QueryRequest;
    static ParseData(data: any): QueryRequest;
    constructor(initialData?: Partial<QueryRequest>);
    filters: Filter[];
    Apply(collection: firebase.firestore.CollectionReference): import("firebase").firestore.CollectionReference;
    toString(): string;
}
export declare class TreeNode<DataShape> {
    constructor(fire: Firelink<any, any>, pathOrSegments: string | string[]);
    fire: Firelink<any, any>;
    pathSegments: string[];
    path: string;
    path_noQuery: string;
    type: TreeNodeType;
    Request(): void;
    Subscribe(): void;
    Unsubscribe(): PathSubscription | null;
    UnsubscribeAll(): void;
    status: DataStatus;
    subscription: PathSubscription | n;
    collectionNodes: ObservableMap<string, TreeNode<any>>;
    data: DataShape;
    SetData(data: DataShape): void;
    queryNodes: ObservableMap<string, TreeNode<any>>;
    query?: QueryRequest;
    docNodes: ObservableMap<string, TreeNode<any>>;
    get docDatas(): any[];
    Get(subpathOrGetterFunc: string | string[] | ((data: DataShape) => any), query?: QueryRequest, createTreeNodesIfMissing?: boolean): TreeNode<any>;
    get raw(): DataShape;
    AsRawData(addTreeLink?: boolean): DataShape;
    UploadRawData(rawData: DataShape): void;
}
export declare function GetTreeNodeTypeForPath(pathOrSegments: string | string[]): TreeNodeType;
export declare function TreeNodeToRawData<DataShape>(treeNode: TreeNode<DataShape>, addTreeLink?: boolean): DataShape;
