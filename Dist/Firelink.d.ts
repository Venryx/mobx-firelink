import firebase from "firebase/app";
import { TreeNode } from "./Tree/TreeNode";
export declare let defaultFireOptions: FireOptions;
export declare function SetDefaultFireOptions(opt: FireOptions): void;
export interface FireOptions {
    fire?: Firelink<any>;
}
export declare class FireUserInfo {
    id: string;
}
export declare class Firelink<DBShape> {
    constructor(dbVersion: number, dbEnv_short: string);
    subs: {
        firestoreDB: firebase.firestore.Firestore;
    };
    userInfo: FireUserInfo;
    tree: TreeNode<DBShape>;
    versionPathSegments: string[];
    versionPath: string;
    ValidateDBData: (dbData: DBShape) => void;
}
