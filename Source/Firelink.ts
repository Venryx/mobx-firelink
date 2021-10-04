import firebase from "firebase/compat/app";
import {signInWithPopup, signInWithRedirect, signInWithCredential, signOut, GoogleAuthProvider, FacebookAuthProvider, TwitterAuthProvider, OAuthProvider, getAuth, UserCredential} from "firebase/auth";
import {TreeNode} from "./Tree/TreeNode.js";
import {TreeRequestWatcher} from "./Tree/TreeRequestWatcher.js";
import {PathOrPathGetterToPath, PathOrPathGetterToPathSegments} from "./Utils/PathHelpers.js";
import {makeObservable, observable, runInAction} from "mobx";
import {RunInAction} from "./Utils/MobX.js";

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

export class FirelinkInitOptions<RootStoreShape> {
	rootPathInDB: string | string[];
	rootStore: RootStoreShape;
	//initSubs = true;
}

export class Firelink<RootStoreShape, DBShape> {
	static instances = [] as Firelink<any, any>[];

	constructor(initOptions?: FirelinkInitOptions<RootStoreShape>) {
		makeObservable(this);
		if (initOptions) {
			this.Initialize(initOptions);
		}
	}

	initialized = false;
	Initialize(initOptions: FirelinkInitOptions<RootStoreShape>) {
		let {rootPathInDB, rootStore} = initOptions;

		Firelink.instances.push(this);
		/*this.versionPathSegments = ["versions", `v${dbVersion}-${dbEnv_short}`];
		this.versionPath = `versions/v${dbVersion}-${dbEnv_short}`;*/
		this.rootPathSegments = PathOrPathGetterToPathSegments(rootPathInDB);
		this.rootPath = PathOrPathGetterToPath(rootPathInDB);
		this.rootStore = rootStore;
		//if (initSubs) {
		this.InitSubs();
		this.tree = new TreeNode(this, []);
		
		this.initialized = true;
	}

	rootPathSegments: string[];
	rootPath: string;
	/*versionPathSegments: string[];
	versionPath: string;*/
	//versionData: DBShape;
	rootStore: RootStoreShape;
	storeOverridesStack = [] as RootStoreShape[];
	storeAccessorCachingTempDisabled = false;

	InitSubs() {
		this.subs.firestoreDB = firebase.firestore();
		firebase.auth().onAuthStateChanged((rawUserInfo)=> {
			RunInAction("Firelink.onAuthStateChanged", ()=> {
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
	@observable.ref userInfo_raw: firebase.User|null;
	@observable.ref userInfo: FireUserInfo|null;
	//@observable test1 = 1;
	async LogIn(opt: {provider: ProviderName, type: "popup" | "redirect"}) {
		const providerClass = GetProviderClassForName(opt.provider);
		let provider = new (providerClass as any)();
		
		let credential: UserCredential|undefined;
		if (opt.type == "popup") {
			credential = await signInWithPopup(getAuth(), provider);
		} else if (opt.type == "redirect") {
			await signInWithRedirect(getAuth(), provider);
			//credential = await firebase.auth().getRedirectResult(); // not sure if this works
		}
		// we don't need to do anything with the user-info; it's handled by the listener in InitSubs()
		console.log("Raw user info:", credential);
		return credential;
	}
	async LogIn_WithCredential(opt: {provider: ProviderName, idToken?: string, accessToken?: string}) {
		const providerClass = GetProviderClassForName(opt.provider);
		let credential = await signInWithCredential(getAuth(), providerClass.credential(opt.idToken!, opt.accessToken!));
		return credential;
	}
	async LogOut() {
		await signOut(getAuth());
	}

	tree: TreeNode<DBShape>;
	treeRequestWatchers = new Set<TreeRequestWatcher>();
	//pathSubscriptions: Map<string, PathSubscription>;
	UnsubscribeAll() {
		this.tree.UnsubscribeAll();
	}

	ValidateDBData?: (dbData: DBShape)=>void;
}

export type ProviderName = "google" | "facebook" | "twitter" | "github";
const providerClasses = {
	google: GoogleAuthProvider,
	facebook: FacebookAuthProvider,
	twitter: TwitterAuthProvider,
	//github: GithubAuthProvider,
} as const;
type OAuthProvider_PossibleClasses = typeof providerClasses[keyof typeof providerClasses];
function GetProviderClassForName(providerName: ProviderName): OAuthProvider_PossibleClasses {
	return providerClasses[providerName];
}