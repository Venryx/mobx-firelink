import firebase from "firebase/app";
import {TreeNode} from "./Tree/TreeNode";
import {TreeRequestWatcher} from "./Tree/TreeRequestWatcher";
import {PathOrPathGetterToPath, PathOrPathGetterToPathSegments} from "./Utils/PathHelpers";

export let defaultFireOptions: FireOptions;
export function SetDefaultFireOptions(opt: FireOptions) {
	defaultFireOptions = opt;
}
export interface FireOptions<RootStoreShape = any, DBShape = any> {
	fire?: Firelink<RootStoreShape, DBShape>;
}

export class FireUserInfo {
	id: string;
	displayName: string;
}

export class Firelink<RootStoreShape, DBShape> {
	static instances = [] as Firelink<any, any>[];

	constructor(rootPathInDB: string | string[], rootStore: RootStoreShape, initSubs = true) {
		Firelink.instances.push(this);
		/*this.versionPathSegments = ["versions", `v${dbVersion}-${dbEnv_short}`];
		this.versionPath = `versions/v${dbVersion}-${dbEnv_short}`;*/
		this.rootPathSegments = PathOrPathGetterToPathSegments(rootPathInDB);
		this.rootPath = PathOrPathGetterToPath(rootPathInDB);
		this.rootStore = rootStore;
		if (initSubs) {
			this.InitSubs();
		}
		this.tree = new TreeNode(this, null);
	}

	rootPathSegments: string[];
	rootPath: string;
	/*versionPathSegments: string[];
	versionPath: string;*/
	//versionData: DBShape;
	rootStore: RootStoreShape;

	InitSubs() {
		this.subs.firestoreDB = firebase.firestore();
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

	

	ValidateDBData: (dbData: DBShape)=>void;
}