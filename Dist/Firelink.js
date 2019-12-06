"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function SetDefaultFireOptions(opt) {
    exports.defaultFireOptions = opt;
}
exports.SetDefaultFireOptions = SetDefaultFireOptions;
class FireUserInfo {
}
exports.FireUserInfo = FireUserInfo;
class Firelink {
    constructor(dbVersion, dbEnv_short) {
        this.treeRequestWatchers = new Set();
        this.versionPathSegments = ["versions", `v${dbVersion}-${dbEnv_short}`];
        this.versionPath = `versions/v${dbVersion}-${dbEnv_short}`;
        this.subs.firestoreDB.collection;
    }
    //pathSubscriptions: Map<string, PathSubscription>;
    UnsubscribeAll() {
        this.tree.UnsubscribeAll();
    }
}
exports.Firelink = Firelink;
//# sourceMappingURL=Firelink.js.map