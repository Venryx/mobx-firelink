import { ObservableMap } from "mobx";
import { FireOptions, Firelink } from "../Firelink";
export declare enum TreeNodeType {
    Root = 0,
    Collection = 1,
    Document = 2
}
export declare class PathSubscription {
    constructor(initialData: Partial<PathSubscription>);
    unsubscribe: () => void;
}
export declare class TreeNode<DataShape> {
    constructor(fire: Firelink<any>, path: string);
    fire: Firelink<any>;
    path: string;
    get type(): TreeNodeType;
    subscriptions: PathSubscription[];
    Subscribe(): void;
    subs: ObservableMap<string, TreeNode<any>>;
    data: DataShape;
    Get(subpathOrGetterFunc: string | ((data: DataShape) => any), createTreeNodesIfMissing?: boolean): this;
    AsRawData(): DataShape;
    UploadRawData(rawData: DataShape): void;
}
export declare function IsPathForCollection(path: string): boolean;
export declare function EnsurePathWatched(opt: FireOptions, path: string): void;
export declare function TreeNodeToRawData<DataShape>(treeNode: TreeNode<DataShape>): DataShape;
