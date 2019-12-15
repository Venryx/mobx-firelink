import firebase from "firebase/app";
import {TreeNode} from "./Tree/TreeNode";
import {TreeRequestWatcher} from "./Tree/TreeRequestWatcher";
import {PathOrPathGetterToPath, PathOrPathGetterToPathSegments} from "./Utils/PathHelpers";
import {observable, runInAction} from "mobx";

export let defaultFireOptions: FireOptions;
export function SetDefaultFireOptions(opt: FireOptions) {
	defaultFireOptions = opt;
}
export interface FireOptions<RootStoreShape = any, DBShape = any> {
	fire: Firelink<RootStoreShape, DBShape>;
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
		this.tree = new TreeNode(this, []);
	}

	rootPathSegments: string[];
	rootPath: string;
	/*versionPathSegments: string[];
	versionPath: string;*/
	//versionData: DBShape;
	rootStore: RootStoreShape;
	storeOverridesStack = [] as RootStoreShape[];

	InitSubs() {
		this.subs.firestoreDB = firebase.firestore();
		firebase.auth().onAuthStateChanged((rawUserInfo)=> {
			runInAction("Firelink.onAuthStateChanged", ()=> {
				this.userInfo_raw = rawUserInfo;
				this.userInfo = rawUserInfo == null ? null : {
					id: rawUserInfo.uid,
					displayName: rawUserInfo.displayName!,
				};
			});
		});
	}
	subs = {} as {
		firestoreDB: firebase.firestore.Firestore;
	};

	//@observable userInfo_raw: firebase.auth.UserCredential;
	@observable userInfo_raw: firebase.User|n;
	@observable userInfo: FireUserInfo|n;
	async LogIn(opt: {provider: "google" | "facebook" | "twitter" | "github", type: "popup"}) {
		let provider: firebase.auth.AuthProvider;
		if (opt.provider == "google") provider = new firebase.auth.GoogleAuthProvider();
		else if (opt.provider == "facebook") provider = new firebase.auth.FacebookAuthProvider();
		else if (opt.provider == "twitter") provider = new firebase.auth.TwitterAuthProvider();
		else /*if (opt.provider == "github")*/ provider = new firebase.auth.GithubAuthProvider();
		
		if (opt.type == "popup") {
			let rawUserInfo = await firebase.auth().signInWithPopup(provider);
			// we don't need to do anything with the user-info; it's handled by the listener in InitSubs()
			console.log("Raw user info:", rawUserInfo);
		}
	}
	async LogOut() {
		await firebase.auth().signOut();
	}

	tree: TreeNode<DBShape>;
	treeRequestWatchers = new Set<TreeRequestWatcher>();
	//pathSubscriptions: Map<string, PathSubscription>;
	UnsubscribeAll() {
		this.tree.UnsubscribeAll();
	}

	ValidateDBData?: (dbData: DBShape)=>void;
}