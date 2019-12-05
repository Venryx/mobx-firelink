"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const js_vextensions_1 = require("js-vextensions");
const mobx_1 = require("mobx");
const PathHelpers_1 = require("../Utils/PathHelpers");
const StringSplitCache_1 = require("../Utils/StringSplitCache");
const Firelink_1 = require("../Firelink");
var TreeNodeType;
(function (TreeNodeType) {
    TreeNodeType[TreeNodeType["Root"] = 0] = "Root";
    TreeNodeType[TreeNodeType["Collection"] = 1] = "Collection";
    TreeNodeType[TreeNodeType["Document"] = 2] = "Document";
})(TreeNodeType = exports.TreeNodeType || (exports.TreeNodeType = {}));
class PathSubscription {
    constructor(initialData) {
        js_vextensions_1.CE(this).Extend(initialData);
    }
}
exports.PathSubscription = PathSubscription;
class TreeNode {
    constructor(fire, path) {
        this.subscriptions = [];
        this.fire = fire;
        this.path = path;
    }
    get type() {
        if (this.path == null)
            return TreeNodeType.Root;
        let segments = StringSplitCache_1.SplitStringBySlash_Cached(this.path);
        //if (segments.length % 2 == 1) return TreeNodeType.Collection;
        if (IsPathForCollection(this.path))
            return TreeNodeType.Collection;
        return TreeNodeType.Document;
    }
    Subscribe() {
        if (this.subscriptions.length)
            return;
        if (IsPathForCollection(this.path)) {
            let unsubscribe = this.fire.subs.firestoreDB.collection(this.path).onSnapshot(function (snapshot) {
                let newData = {};
                for (let doc of snapshot.docs) {
                    newData[doc.id] = doc.data();
                }
                this.data = mobx_1.observable(newData);
            });
            this.subscriptions.push(new PathSubscription({ unsubscribe }));
        }
        else {
            let unsubscribe = this.fire.subs.firestoreDB.doc(this.path).onSnapshot(function (snapshot) {
                this.data = mobx_1.observable(snapshot.data());
            });
            this.subscriptions.push(new PathSubscription({ unsubscribe }));
        }
    }
    Get(subpathOrGetterFunc, createTreeNodesIfMissing = true) {
        let subpathSegments = PathHelpers_1.PathOrPathGetterToPathSegments(subpathOrGetterFunc);
        let result = this;
        for (let [index, segment] of subpathSegments.entries()) {
            if (result[segment] == null) {
                if (createTreeNodesIfMissing) {
                    let pathToSegment = subpathSegments.slice(0, index).join("/");
                    result[segment] = new TreeNode(this.fire, pathToSegment);
                }
                else {
                    result = null;
                    break;
                }
            }
            result = result[segment];
        }
        return result;
    }
    AsRawData() {
        return TreeNodeToRawData(this);
    }
    UploadRawData(rawData) {
        // todo
    }
}
exports.TreeNode = TreeNode;
function IsPathForCollection(path) {
    return path.split("/").length % 2 == 1;
}
exports.IsPathForCollection = IsPathForCollection;
function EnsurePathWatched(opt, path) {
    opt = js_vextensions_1.E(Firelink_1.defaultFireOptions, opt);
    let treeNode = opt.fire.tree.Get(path);
    if (treeNode.subscriptions.length)
        return;
    treeNode.Subscribe();
}
exports.EnsurePathWatched = EnsurePathWatched;
function TreeNodeToRawData(treeNode) {
    let result = {};
    if (treeNode.data) {
        js_vextensions_1.CE(result).Extend(treeNode.data);
    }
    js_vextensions_1.CE(result)._AddItem("_path", treeNode.path);
    if (treeNode.subs) {
        let subNodes = Array.from(treeNode.subs.values());
        let subsAsRawData = subNodes.map(subNode => TreeNodeToRawData(subNode));
        js_vextensions_1.CE(result)._AddItem("_subs", subsAsRawData);
    }
    return result;
}
exports.TreeNodeToRawData = TreeNodeToRawData;
//# sourceMappingURL=TreeNode.js.map