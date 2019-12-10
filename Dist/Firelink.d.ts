import firebase from "firebase/app";
import { TreeNode } from "./Tree/TreeNode";
import { TreeRequestWatcher } from "./Tree/TreeRequestWatcher";
export declare let defaultFireOptions: FireOptions;
export declare function SetDefaultFireOptions(opt: FireOptions): void;
export interface FireOptions {
    fire?: Firelink<any, any>;
}
export declare class FireUserInfo {
    id: string;
    displayName: string;
}
export declare class Firelink<RootStoreShape, DBShape> {
    constructor(dbVersion: number, dbEnv_short: string, rootStore: RootStoreShape);
    versionPathSegments: string[];
    versionPath: string;
    rootStore: RootStoreShape;
    subs: {
        firestoreDB: firebase.firestore.Firestore;
    };
    userInfo_raw: firebase.auth.UserCredential;
    userInfo: FireUserInfo;
    LogIn(opt: {
        provider: "google" | "facebook" | "twitter" | "github";
        type: "popup";
    }): Promise<void>;
    LogOut(): void;
    tree: TreeNode<DBShape>;
    treeRequestWatchers: Set<TreeRequestWatcher>;
    UnsubscribeAll(): void;
    ValidateDBData: (dbData: DBShape) => void;
}
