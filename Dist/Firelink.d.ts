import firebase from "firebase/app";
import { TreeNode } from "./Tree/TreeNode";
import { TreeRequestWatcher } from "./Tree/TreeRequestWatcher";
export declare let defaultFireOptions: FireOptions;
export declare function SetDefaultFireOptions(opt: FireOptions): void;
export interface FireOptions<RootStoreShape = any, DBShape = any> {
    fire: Firelink<RootStoreShape, DBShape>;
}
export declare class FireUserInfo {
    id: string;
    displayName: string;
}
export declare class FirelinkInitOptions<RootStoreShape> {
    rootPathInDB: string | string[];
    rootStore: RootStoreShape;
}
export declare class Firelink<RootStoreShape, DBShape> {
    static instances: Firelink<any, any>[];
    constructor(initOptions?: FirelinkInitOptions<RootStoreShape>);
    initialized: boolean;
    Initialize(initOptions: FirelinkInitOptions<RootStoreShape>): void;
    rootPathSegments: string[];
    rootPath: string;
    rootStore: RootStoreShape;
    storeOverridesStack: RootStoreShape[];
    InitSubs(): void;
    subs: {
        firestoreDB: firebase.firestore.Firestore;
    };
    userInfo_raw: firebase.User | null;
    userInfo: FireUserInfo | null;
    LogIn(opt: {
        provider: "google" | "facebook" | "twitter" | "github";
        type: "popup";
    }): Promise<void>;
    LogOut(): Promise<void>;
    tree: TreeNode<DBShape>;
    treeRequestWatchers: Set<TreeRequestWatcher>;
    UnsubscribeAll(): void;
    ValidateDBData?: (dbData: DBShape) => void;
}
