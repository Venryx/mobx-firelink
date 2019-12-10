"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("firebase/app");
const TreeNode_1 = require("./Tree/TreeNode");
const PathHelpers_1 = require("./Utils/PathHelpers");
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
    }
    async LogIn(opt) {
        if (opt.type == "popup") {
            this.userInfo_raw = await app_1.default.auth().signInWithPopup({ providerId: opt.provider });
            this.userInfo.id = this.userInfo_raw.user.uid;
            this.userInfo.displayName = this.userInfo_raw.user.displayName;
        }
    }
    LogOut() {
        // todo
    }
    //pathSubscriptions: Map<string, PathSubscription>;
    UnsubscribeAll() {
        this.tree.UnsubscribeAll();
    }
}
exports.Firelink = Firelink;
Firelink.instances = [];
//# sourceMappingURL=Firelink.js.map