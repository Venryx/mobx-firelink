var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import firebase from "firebase/app";
import { TreeNode } from "./Tree/TreeNode";
import { PathOrPathGetterToPath, PathOrPathGetterToPathSegments } from "./Utils/PathHelpers";
import { observable, runInAction } from "mobx";
export let defaultFireOptions;
export function SetDefaultFireOptions(opt) {
    defaultFireOptions = opt;
}
export class FireUserInfo {
}
export class FirelinkInitOptions {
}
export class Firelink {
    constructor(initOptions) {
        this.initialized = false;
        this.storeOverridesStack = [];
        this.subs = {};
        this.treeRequestWatchers = new Set();
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
        this.subs.firestoreDB = firebase.firestore();
        firebase.auth().onAuthStateChanged((rawUserInfo) => {
            runInAction("Firelink.onAuthStateChanged", () => {
                this.userInfo_raw = rawUserInfo;
                this.userInfo = rawUserInfo == null ? null : {
                    id: rawUserInfo.uid,
                    displayName: rawUserInfo.displayName,
                };
            });
        });
    }
    LogIn(opt) {
        return __awaiter(this, void 0, void 0, function* () {
            const providerClass = GetProviderClassForName(opt.provider);
            let provider = new providerClass();
            let credential;
            if (opt.type == "popup") {
                credential = yield firebase.auth().signInWithPopup(provider);
            }
            else if (opt.type == "redirect") {
                yield firebase.auth().signInWithRedirect(provider);
                //credential = await firebase.auth().getRedirectResult(); // not sure if this works
            }
            // we don't need to do anything with the user-info; it's handled by the listener in InitSubs()
            //console.log("Raw user info:", rawUserInfo);
            return credential;
        });
    }
    LogIn_WithCredential(opt) {
        return __awaiter(this, void 0, void 0, function* () {
            const providerClass = GetProviderClassForName(opt.provider);
            let credential = yield firebase.auth().signInWithCredential(providerClass.credential(opt.idToken || null, opt.accessToken));
            return credential;
        });
    }
    LogOut() {
        return __awaiter(this, void 0, void 0, function* () {
            yield firebase.auth().signOut();
        });
    }
    //pathSubscriptions: Map<string, PathSubscription>;
    UnsubscribeAll() {
        this.tree.UnsubscribeAll();
    }
}
Firelink.instances = [];
__decorate([
    observable
], Firelink.prototype, "userInfo_raw", void 0);
__decorate([
    observable
], Firelink.prototype, "userInfo", void 0);
const providerClasses = {
    google: firebase.auth.GoogleAuthProvider,
    facebook: firebase.auth.FacebookAuthProvider,
    twitter: firebase.auth.TwitterAuthProvider,
};
function GetProviderClassForName(providerName) {
    return providerClasses[providerName];
}
