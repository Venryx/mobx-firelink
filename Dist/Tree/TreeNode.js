"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const js_vextensions_1 = require("js-vextensions");
const mobx_1 = require("mobx");
const PathHelpers_1 = require("../Utils/PathHelpers");
var TreeNodeType;
(function (TreeNodeType) {
    TreeNodeType[TreeNodeType["Root"] = 0] = "Root";
    TreeNodeType[TreeNodeType["Collection"] = 1] = "Collection";
    TreeNodeType[TreeNodeType["CollectionQuery"] = 2] = "CollectionQuery";
    TreeNodeType[TreeNodeType["Document"] = 3] = "Document";
})(TreeNodeType = exports.TreeNodeType || (exports.TreeNodeType = {}));
var DataStatus;
(function (DataStatus) {
    DataStatus[DataStatus["Initial"] = 0] = "Initial";
    DataStatus[DataStatus["Waiting"] = 1] = "Waiting";
    DataStatus[DataStatus["Received"] = 2] = "Received";
})(DataStatus = exports.DataStatus || (exports.DataStatus = {}));
class PathSubscription {
    constructor(unsubscribe) {
        this.unsubscribe = unsubscribe;
    }
}
exports.PathSubscription = PathSubscription;
class QueryRequest {
    constructor(initialData) {
        js_vextensions_1.CE(this).Extend(initialData);
    }
    Apply(collection) {
        let result = collection;
        for (let filter of this.filters) {
            result = filter.Apply(result);
        }
        return result;
    }
    toString() {
        return js_vextensions_1.ToJSON(this.filters);
    }
}
exports.QueryRequest = QueryRequest;
class TreeNode {
    constructor(fire, pathOrSegments) {
        this.status = DataStatus.Initial;
        /*get childNodes() {
            if (this.type == TreeNodeType.Collection || this.type == TreeNodeType.CollectionQuery) return this.docNodes;
            return this.collectionNodes;
        }*/
        // for doc (and root) nodes
        this.collectionNodes = mobx_1.observable.map();
        // for collection (and collection-query) nodes
        this.queryNodes = mobx_1.observable.map(); // for collection nodes
        this.docNodes = mobx_1.observable.map();
        this.fire = fire;
        this.path = PathHelpers_1.PathOrPathGetterToPath(pathOrSegments);
        this.pathSegments = PathHelpers_1.PathOrPathGetterToPathSegments(pathOrSegments);
        this.type = GetTreeNodeTypeForPath(this.pathSegments);
    }
    Request() {
        this.fire.treeRequestWatchers.forEach(a => a.nodesRequested.add(this));
        if (!this.subscription) {
            this.Subscribe();
        }
    }
    Subscribe() {
        js_vextensions_1.Assert(this.subscription == null, "Cannot subscribe more than once!");
        this.status = DataStatus.Waiting;
        if (this.type == TreeNodeType.Root || this.type == TreeNodeType.Document) {
            let docRef = this.fire.subs.firestoreDB.doc(this.path);
            this.subscription = new PathSubscription(docRef.onSnapshot(function (snapshot) {
                this.data = mobx_1.observable(snapshot.data());
                this.status = DataStatus.Received;
            }));
        }
        else {
            let collectionRef = this.fire.subs.firestoreDB.collection(this.path);
            if (this.query) {
                collectionRef = this.query.Apply(collectionRef);
            }
            this.subscription = new PathSubscription(collectionRef.onSnapshot(function (snapshot) {
                let newData = {};
                for (let doc of snapshot.docs) {
                    newData[doc.id] = doc.data();
                }
                this.data = mobx_1.observable(newData);
                this.status = DataStatus.Received;
            }));
        }
    }
    Unsubscribe() {
        if (this.subscription == null)
            return null;
        let subscription = this.subscription;
        this.subscription.unsubscribe();
        this.subscription = null;
        return subscription;
    }
    UnsubscribeAll() {
        this.Unsubscribe();
        this.collectionNodes.forEach(a => a.UnsubscribeAll());
        this.queryNodes.forEach(a => a.UnsubscribeAll());
        this.docNodes.forEach(a => a.UnsubscribeAll());
    }
    Get(subpathOrGetterFunc, query, createTreeNodesIfMissing = true) {
        let subpathSegments = PathHelpers_1.PathOrPathGetterToPathSegments(subpathOrGetterFunc);
        let currentNode = this;
        for (let [index, segment] of subpathSegments.entries()) {
            let subpathSegmentsToHere = subpathSegments.slice(0, index);
            let childNodesMap = currentNode[currentNode.type == TreeNodeType.Collection ? "docNodes" : "collectionNodes"];
            if (!childNodesMap.has(segment) && createTreeNodesIfMissing) {
                //let pathToSegment = subpathSegments.slice(0, index).join("/");
                childNodesMap.set(segment, new TreeNode(this.fire, this.pathSegments.concat(subpathSegmentsToHere)));
            }
            currentNode = childNodesMap.get(segment);
            if (currentNode == null)
                break;
        }
        if (query) {
            if (!currentNode.queryNodes.has(query.toString()) && createTreeNodesIfMissing) {
                currentNode.queryNodes.set(query.toString(), new TreeNode(this.fire, this.pathSegments.concat(subpathSegments).concat("@query:")));
            }
            currentNode = currentNode.queryNodes.get(query.toString());
        }
        return currentNode;
    }
    AsRawData() {
        return TreeNodeToRawData(this);
    }
    UploadRawData(rawData) {
        // todo
    }
}
exports.TreeNode = TreeNode;
function GetTreeNodeTypeForPath(pathOrSegments) {
    let pathSegments = PathHelpers_1.PathOrPathGetterToPathSegments(pathOrSegments);
    if (pathSegments == null || pathSegments.length == 0)
        return TreeNodeType.Root;
    if (js_vextensions_1.CE(pathSegments).Last().startsWith("@query:"))
        return TreeNodeType.CollectionQuery;
    return pathSegments.length % 2 == 1 ? TreeNodeType.Collection : TreeNodeType.Document;
}
exports.GetTreeNodeTypeForPath = GetTreeNodeTypeForPath;
/*export function EnsurePathWatched(opt: FireOptions, path: string, filters?: Filter[]) {
    opt = E(defaultFireOptions, opt);
    let treeNode = opt.fire.tree.Get(path);
    if (treeNode.subscriptions.length) return;
    treeNode.Subscribe(filters ? new QueryRequest({filters}) : null);
}*/
function TreeNodeToRawData(treeNode) {
    let result = {};
    if (treeNode.data) {
        js_vextensions_1.CE(result).Extend(treeNode.data);
    }
    js_vextensions_1.CE(result)._AddItem("_path", treeNode.path);
    if (treeNode.docNodes) {
        let docsAsRawData = Array.from(treeNode.docNodes.values()).map(docNode => TreeNodeToRawData(docNode));
        js_vextensions_1.CE(result)._AddItem("_subs", docsAsRawData);
    }
    return result;
}
exports.TreeNodeToRawData = TreeNodeToRawData;
//# sourceMappingURL=TreeNode.js.map