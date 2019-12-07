import firebase from "firebase/app";
import {TreeNode} from "./Tree/TreeNode";
import {TreeRequestWatcher} from "./Tree/TreeRequestWatcher";

export let defaultFireOptions: FireOptions;
export function SetDefaultFireOptions(opt: FireOptions) {
	defaultFireOptions = opt;
}
export interface FireOptions {
	fire?: Firelink<any>;
}

export class FireUserInfo {
	id: string;
	displayName: string;
}

export class Firelink<DBShape> {
	constructor(dbVersion: number, dbEnv_short: string) {
		this.versionPathSegments = ["versions", `v${dbVersion}-${dbEnv_short}`];
		this.versionPath = `versions/v${dbVersion}-${dbEnv_short}`;
		this.subs.firestoreDB = firebase.firestore();
		this.tree = new TreeNode(this, null);
	}

	subs = {} as {
		firestoreDB: firebase.firestore.Firestore;
	};

	userInfo_raw: firebase.auth.UserCredential;
	userInfo: FireUserInfo;
	async LogIn(opt: {provider: "google" | "facebook" | "twitter" | "github", type: "popup"}) {
		if (opt.type == "popup") {
			this.userInfo_raw = await firebase.auth().signInWithPopup({providerId: opt.provider});
			this.userInfo.id = this.userInfo_raw.user.uid;
			this.userInfo.displayName = this.userInfo_raw.user.displayName;
		}
	}
	LogOut() {
		// todo
	}

	tree: TreeNode<DBShape>;
	treeRequestWatchers = new Set<TreeRequestWatcher>();
	//pathSubscriptions: Map<string, PathSubscription>;
	UnsubscribeAll() {
		this.tree.UnsubscribeAll();
	}

	versionPathSegments: string[];
	versionPath: string;
	//versionData: DBShape;

	ValidateDBData: (dbData: DBShape)=>void;
}