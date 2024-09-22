import { Firestore } from "firebase/firestore";
import { UserCredential, User } from "firebase/auth";
import { TreeNode } from "./Tree/TreeNode.js";
import { TreeRequestWatcher } from "./Tree/TreeRequestWatcher.js";
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
    storeAccessorCachingTempDisabled: boolean;
    InitSubs(): void;
    subs: {
        firestoreDB: Firestore;
    };
    userInfo_raw: User | null;
    userInfo: FireUserInfo | null;
    LogIn(opt: {
        provider: ProviderName;
        type: "popup" | "redirect";
    }): Promise<UserCredential | undefined>;
    LogIn_WithCredential(opt: {
        provider: ProviderName;
        idToken?: string;
        accessToken?: string;
    }): Promise<UserCredential>;
    LogOut(): Promise<void>;
    tree: TreeNode<DBShape>;
    treeRequestWatchers: Set<TreeRequestWatcher>;
    UnsubscribeAll(): void;
    ValidateDBData?: (dbData: DBShape) => void;
}
export type ProviderName = "google" | "facebook" | "twitter" | "github";
