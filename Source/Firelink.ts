import {ObservableMap, observable} from "mobx";
import {Filter} from "./Filters";
import {Assert, E, DeepSet, CE} from "js-vextensions";
import {UserInfo} from "os";
import firebase from "firebase/app";
import {TreeNode, PathSubscription} from "./Tree/TreeNode";
import {SplitStringBySlash_Cached} from "./Utils/StringSplitCache";

export let defaultFireOptions: FireOptions;
export function SetDefaultFireOptions(opt: FireOptions) {
	defaultFireOptions = opt;
}
export interface FireOptions {
	fire?: Firelink<any>;
}

export class FireUserInfo {
	id: string;
}

export class Firelink<DBShape> {
	constructor(dbVersion: number, dbEnv_short: string) {
		this.versionPathSegments = ["versions", `v${dbVersion}-${dbEnv_short}`];
		this.versionPath = `versions/v${dbVersion}-${dbEnv_short}`;
		this.subs.firestoreDB.collection
	}

	subs: {
		firestoreDB: firebase.firestore.Firestore;
	};

	userInfo: FireUserInfo;

	tree: TreeNode<DBShape>;
	//pathSubscriptions: Map<string, PathSubscription>;

	versionPathSegments: string[];
	versionPath: string;
	//versionData: DBShape;

	ValidateDBData: (dbData: DBShape)=>void;
}