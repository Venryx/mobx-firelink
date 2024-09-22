var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { getFirestore } from "firebase/firestore";
import { signInWithPopup, signInWithRedirect, signInWithCredential, signOut, GoogleAuthProvider, FacebookAuthProvider, TwitterAuthProvider, getAuth, onAuthStateChanged } from "firebase/auth";
import { TreeNode } from "./Tree/TreeNode.js";
import { PathOrPathGetterToPath, PathOrPathGetterToPathSegments } from "./Utils/PathHelpers.js";
import { makeObservable, observable } from "mobx";
import { RunInAction } from "./Utils/MobX.js";
export let defaultFireOptions;
export function SetDefaultFireOptions(opt) {
    defaultFireOptions = opt;
}
export class FireUserInfo {
    constructor() {
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "displayName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
}
export class FirelinkInitOptions {
    constructor() {
        Object.defineProperty(this, "rootPathInDB", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "rootStore", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        //initSubs = true;
    }
}
export class Firelink {
    constructor(initOptions) {
        Object.defineProperty(this, "initialized", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "rootPathSegments", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "rootPath", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /*versionPathSegments: string[];
        versionPath: string;*/
        //versionData: DBShape;
        Object.defineProperty(this, "rootStore", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "storeOverridesStack", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "storeAccessorCachingTempDisabled", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "subs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        //@observable userInfo_raw: firebase.auth.UserCredential;
        Object.defineProperty(this, "userInfo_raw", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "userInfo", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "tree", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "treeRequestWatchers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Set()
        });
        Object.defineProperty(this, "ValidateDBData", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        makeObservable(this);
        if (initOptions) {
            this.Initialize(initOptions);
        }
    }
    Initialize(initOptions) {
        let { rootPathInDB, rootStore } = initOptions;
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
    InitSubs() {
        this.subs.firestoreDB = getFirestore();
        onAuthStateChanged(getAuth(), (rawUserInfo) => {
            RunInAction("Firelink.onAuthStateChanged", () => {
                this.userInfo_raw = rawUserInfo;
                this.userInfo = rawUserInfo == null ? null : {
                    id: rawUserInfo.uid,
                    displayName: rawUserInfo.displayName,
                };
            });
        });
    }
    //@observable test1 = 1;
    async LogIn(opt) {
        const providerClass = GetProviderClassForName(opt.provider);
        let provider = new providerClass();
        let credential;
        if (opt.type == "popup") {
            credential = await signInWithPopup(getAuth(), provider);
        }
        else if (opt.type == "redirect") {
            await signInWithRedirect(getAuth(), provider);
            //credential = await firebase.auth().getRedirectResult(); // not sure if this works
        }
        // we don't need to do anything with the user-info; it's handled by the listener in InitSubs()
        console.log("Raw user info:", credential);
        return credential;
    }
    async LogIn_WithCredential(opt) {
        const providerClass = GetProviderClassForName(opt.provider);
        let credential = await signInWithCredential(getAuth(), providerClass.credential(opt.idToken, opt.accessToken));
        return credential;
    }
    async LogOut() {
        await signOut(getAuth());
    }
    //pathSubscriptions: Map<string, PathSubscription>;
    UnsubscribeAll() {
        this.tree.UnsubscribeAll();
    }
}
Object.defineProperty(Firelink, "instances", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: []
});
__decorate([
    observable.ref
], Firelink.prototype, "userInfo_raw", void 0);
__decorate([
    observable.ref
], Firelink.prototype, "userInfo", void 0);
const providerClasses = {
    google: GoogleAuthProvider,
    facebook: FacebookAuthProvider,
    twitter: TwitterAuthProvider,
    //github: GithubAuthProvider,
};
function GetProviderClassForName(providerName) {
    return providerClasses[providerName];
}
