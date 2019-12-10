"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("firebase/app");
const TreeNode_1 = require("./Tree/TreeNode");
function SetDefaultFireOptions(opt) {
    exports.defaultFireOptions = opt;
}
exports.SetDefaultFireOptions = SetDefaultFireOptions;
class FireUserInfo {
}
exports.FireUserInfo = FireUserInfo;
class Firelink {
    constructor(dbVersion, dbEnv_short, rootStore) {
        this.subs = {};
        this.treeRequestWatchers = new Set();
        this.versionPathSegments = ["versions", `v${dbVersion}-${dbEnv_short}`];
        this.versionPath = `versions/v${dbVersion}-${dbEnv_short}`;
        this.rootStore = rootStore;
        this.subs.firestoreDB = app_1.default.firestore();
        this.tree = new TreeNode_1.TreeNode(this, null);
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
//# sourceMappingURL=Firelink.js.map