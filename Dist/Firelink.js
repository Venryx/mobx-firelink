"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("firebase/app");
const TreeNode_1 = require("./Tree/TreeNode");
const PathHelpers_1 = require("./Utils/PathHelpers");
const mobx_1 = require("mobx");
function SetDefaultFireOptions(opt) {
    exports.defaultFireOptions = opt;
}
exports.SetDefaultFireOptions = SetDefaultFireOptions;
class FireUserInfo {
}
exports.FireUserInfo = FireUserInfo;
class Firelink {
    constructor(rootPathInDB, rootStore, initSubs = true) {
        this.subs = {};
        this.treeRequestWatchers = new Set();
        Firelink.instances.push(this);
        /*this.versionPathSegments = ["versions", `v${dbVersion}-${dbEnv_short}`];
        this.versionPath = `versions/v${dbVersion}-${dbEnv_short}`;*/
        this.rootPathSegments = PathHelpers_1.PathOrPathGetterToPathSegments(rootPathInDB);
        this.rootPath = PathHelpers_1.PathOrPathGetterToPath(rootPathInDB);
        this.rootStore = rootStore;
        if (initSubs) {
            this.InitSubs();
        }
        this.tree = new TreeNode_1.TreeNode(this, null);
    }
    InitSubs() {
        this.subs.firestoreDB = app_1.default.firestore();
        app_1.default.auth().onAuthStateChanged((rawUserInfo) => {
            mobx_1.runInAction("Firelink.onAuthStateChanged", () => {
                this.userInfo_raw = rawUserInfo;
                this.userInfo = rawUserInfo == null ? null : {
                    id: rawUserInfo.uid,
                    displayName: rawUserInfo.displayName,
                };
            });
        });
    }
    async LogIn(opt) {
        let provider;
        if (opt.provider == "google")
            provider = new app_1.default.auth.GoogleAuthProvider();
        else if (opt.provider == "facebook")
            provider = new app_1.default.auth.FacebookAuthProvider();
        else if (opt.provider == "twitter")
            provider = new app_1.default.auth.TwitterAuthProvider();
        else if (opt.provider == "github")
            provider = new app_1.default.auth.GithubAuthProvider();
        if (opt.type == "popup") {
            let rawUserInfo = await app_1.default.auth().signInWithPopup(provider);
            // we don't need to do anything with the user-info; it's handled by the listener in InitSubs()
            console.log("Raw user info:", rawUserInfo);
        }
    }
    async LogOut() {
        await app_1.default.auth().signOut();
    }
    //pathSubscriptions: Map<string, PathSubscription>;
    UnsubscribeAll() {
        this.tree.UnsubscribeAll();
    }
}
Firelink.instances = [];
__decorate([
    mobx_1.observable
], Firelink.prototype, "userInfo_raw", void 0);
__decorate([
    mobx_1.observable
], Firelink.prototype, "userInfo", void 0);
exports.Firelink = Firelink;
//# sourceMappingURL=Firelink.js.map